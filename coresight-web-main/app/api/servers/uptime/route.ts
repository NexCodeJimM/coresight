import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.id as serverId,
        s.name as serverName,
        u.status,
        u.last_checked as lastChecked,
        u.uptime,
        u.last_downtime as lastDowntime
      FROM servers s
      LEFT JOIN server_uptime u ON s.id = u.server_id
      ORDER BY s.name ASC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch uptime data:", error);
    return NextResponse.json(
      { error: "Failed to fetch uptime data" },
      { status: 500 }
    );
  }
}
