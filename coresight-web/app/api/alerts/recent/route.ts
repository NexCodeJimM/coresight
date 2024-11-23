import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface AlertRow extends RowDataPacket {
  id: string;
  severity: string;
  message: string;
  server_id: string;
  server_name: string;
  created_at: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get recent alerts with server names
    const [rows] = await pool.query<AlertRow[]>(`
      SELECT 
        a.id,
        a.severity,
        a.message,
        a.server_id,
        s.name as server_name,
        a.created_at
      FROM alerts a
      JOIN servers s ON a.server_id = s.id
      WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    const alerts = rows.map((row) => ({
      id: row.id,
      severity: row.severity,
      message: row.message,
      server_name: row.server_name,
      created_at: row.created_at.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error("Error fetching recent alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recent alerts",
      },
      { status: 500 }
    );
  }
}
