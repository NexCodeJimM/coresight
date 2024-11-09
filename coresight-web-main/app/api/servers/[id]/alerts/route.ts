import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const status = searchParams.get("status") || "active";

    const [alerts] = await db.query(
      `SELECT 
        a.*,
        s.name as server_name,
        s.ip_address
      FROM alerts a
      JOIN servers s ON a.server_id = s.id
      WHERE a.server_id = ? AND a.status = ?
      ORDER BY 
        CASE a.severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        a.created_at DESC
      LIMIT ?`,
      [params.id, status, limit]
    );

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Failed to fetch server alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch server alerts" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, severity, message } = body;

    if (!type || !severity || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify server exists
    const [servers] = await db.query("SELECT id FROM servers WHERE id = ?", [
      params.id,
    ]);
    if (!(servers as any[]).length) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const [result] = await db.query(
      `INSERT INTO alerts (server_id, type, severity, message, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [params.id, type, severity, message]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create server alert:", error);
    return NextResponse.json(
      { error: "Failed to create server alert" },
      { status: 500 }
    );
  }
}
