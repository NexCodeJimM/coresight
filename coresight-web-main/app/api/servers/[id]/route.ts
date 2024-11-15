import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [servers] = await db.query(
      `SELECT 
        s.*,
        (
          SELECT COUNT(*) 
          FROM alerts 
          WHERE server_id = s.id AND status = 'active'
        ) as active_alerts,
        COALESCE(s.status, 'inactive') as status
      FROM servers s 
      WHERE s.id = ?`,
      [params.id]
    );

    const server = (servers as any[])[0];

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...server,
      status: server.status || "inactive",
    });
  } catch (error) {
    console.error("Failed to fetch server:", error);
    return NextResponse.json(
      { error: "Failed to fetch server data" },
      { status: 500 }
    );
  }
}
