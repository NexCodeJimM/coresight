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
  memory_total: number;
  memory_used: number;
  disk_usage: number;
  disk_total: number;
  disk_used: number;
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

    // Get current metrics
    const [currentMetricsRows] = await pool.query<MetricsRow[]>(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [id]
    );

    // Transform current metrics
    const currentMetrics = currentMetricsRows[0]
      ? {
          cpu: {
            usage: currentMetricsRows[0].cpu_usage,
          },
          memory: {
            usage: currentMetricsRows[0].memory_usage,
            used: currentMetricsRows[0].memory_used,
            total: currentMetricsRows[0].memory_total,
          },
          disk: {
            usage: currentMetricsRows[0].disk_usage,
            used: currentMetricsRows[0].disk_used,
            total: currentMetricsRows[0].disk_total,
          },
          network: {
            bytes_sent: currentMetricsRows[0].network_out,
            bytes_recv: currentMetricsRows[0].network_in,
          },
        }
      : null;

    return NextResponse.json({
      success: true,
      current: currentMetrics,
    });
  } catch (error) {
    console.error("Error fetching current metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch current metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
