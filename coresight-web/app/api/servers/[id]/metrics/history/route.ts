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
  network_in: number;
  network_out: number;
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

    // Get historical metrics
    const [historicalMetricsRows] = await pool.query<MetricsRow[]>(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY timestamp ASC`,
      [id]
    );

    // Transform historical metrics
    const historicalMetrics = historicalMetricsRows.map((row) => ({
      timestamp: row.timestamp,
      cpu_usage: row.cpu_usage,
      memory_usage: row.memory_usage,
      network_in: row.network_in,
      network_out: row.network_out,
    }));

    return NextResponse.json({
      success: true,
      history: historicalMetrics,
    });
  } catch (error) {
    console.error("Error fetching historical metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch historical metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
