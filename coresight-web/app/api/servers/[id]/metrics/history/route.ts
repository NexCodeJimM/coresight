import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface MetricsRow extends RowDataPacket {
  date: string;
  avg_cpu: number;
  avg_memory: number;
  avg_disk: number;
  avg_network_in: number;
  avg_network_out: number;
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

    // Get daily averages for the last 7 days
    const [historicalMetricsRows] = await pool.query<MetricsRow[]>(
      `SELECT 
        DATE(timestamp) as date,
        AVG(cpu_usage) as avg_cpu,
        AVG(memory_usage) as avg_memory,
        AVG(disk_usage) as avg_disk,
        AVG(network_in) as avg_network_in,
        AVG(network_out) as avg_network_out
       FROM server_metrics 
       WHERE server_id = ? 
       AND timestamp >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(timestamp)
       ORDER BY date ASC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      history: historicalMetricsRows,
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
