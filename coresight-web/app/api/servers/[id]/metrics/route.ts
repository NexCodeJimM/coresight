import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

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
    const [currentMetrics] = await pool.query(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [id]
    );

    // Get historical metrics (last 24 hours)
    const [historicalMetrics] = await pool.query(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY timestamp ASC`,
      [id]
    );

    return NextResponse.json({
      success: true,
      current: (currentMetrics as any[])[0] || null,
      history: historicalMetrics,
    });
  } catch (error) {
    console.error("Error fetching server metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch server metrics",
        details: error,
      },
      { status: 500 }
    );
  }
}
