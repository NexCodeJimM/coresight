import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface MetricsRow extends RowDataPacket {
  id: string;
  server_id: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  temperature: number;
  timestamp: Date;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Get current metrics (most recent)
    const [currentMetrics] = await pool.query<MetricsRow[]>(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [id]
    );

    // Get historical metrics (last 24 hours)
    const [historicalMetrics] = await pool.query<MetricsRow[]>(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY timestamp ASC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      current: currentMetrics[0] || null,
      history: historicalMetrics,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
