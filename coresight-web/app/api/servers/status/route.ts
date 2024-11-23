import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface ServerStatusRow extends RowDataPacket {
  id: string;
  name: string;
  ip_address: string;
  status: string;
  cpu_usage: number;
  memory_usage: number;
  last_seen: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get latest metrics for each server
    const [rows] = await pool.query<ServerStatusRow[]>(`
      SELECT 
        s.id,
        s.name,
        s.ip_address,
        CASE 
          WHEN su.last_checked >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'online'
          ELSE 'offline'
        END as status,
        COALESCE(m.cpu_usage, 0) as cpu_usage,
        COALESCE(m.memory_usage, 0) as memory_usage,
        su.last_checked as last_seen
      FROM servers s
      LEFT JOIN server_uptime su ON s.id = su.server_id
      LEFT JOIN (
        SELECT 
          server_id,
          cpu_usage,
          memory_usage,
          ROW_NUMBER() OVER (PARTITION BY server_id ORDER BY timestamp DESC) as rn
        FROM server_metrics
      ) m ON s.id = m.server_id AND m.rn = 1
      WHERE s.status = 'active'
      ORDER BY s.name ASC
    `);

    const servers = rows.map((row) => ({
      id: row.id,
      name: row.name,
      ip_address: row.ip_address,
      status: row.status as "online" | "offline",
      cpu: parseFloat(row.cpu_usage.toFixed(1)),
      memory: parseFloat(row.memory_usage.toFixed(1)),
    }));

    return NextResponse.json({
      success: true,
      servers,
    });
  } catch (error) {
    console.error("Error fetching server status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch server status",
      },
      { status: 500 }
    );
  }
}
