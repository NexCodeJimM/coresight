import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [alerts] = await db.query(`
      SELECT 
        a.*,
        s.name as server_name,
        s.ip_address
      FROM alerts a
      JOIN servers s ON a.server_id = s.id
      WHERE a.status = 'active'
      ORDER BY 
        CASE a.severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        a.created_at DESC
      LIMIT 100
    `);

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { server_id, type, severity, message } = body;

    if (!server_id || !type || !severity || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [result] = await db.query(
      `INSERT INTO alerts (server_id, type, severity, message, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [server_id, type, severity, message]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}
