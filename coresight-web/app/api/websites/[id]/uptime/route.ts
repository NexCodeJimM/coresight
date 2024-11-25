import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface UptimeRow extends RowDataPacket {
  status: "up" | "down";
  response_time: number | null;
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
    const { searchParams } = new URL(req.url);
    const hours = Number(searchParams.get('hours')) || 24;

    // Get uptime history
    const [uptimeHistory] = await pool.query<UptimeRow[]>(
      `SELECT status, response_time, timestamp
       FROM website_uptime 
       WHERE website_id = ? 
       AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY timestamp ASC`,
      [id, hours]
    );

    // Calculate uptime percentage
    const totalChecks = uptimeHistory.length;
    const upChecks = uptimeHistory.filter(check => check.status === 'up').length;
    const uptimePercentage = totalChecks > 0 
      ? (upChecks / totalChecks * 100).toFixed(2)
      : 100;

    // Calculate average response time
    const validResponseTimes = uptimeHistory
      .filter(check => check.response_time != null)
      .map(check => check.response_time as number);
    const avgResponseTime = validResponseTimes.length > 0
      ? (validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length).toFixed(2)
      : null;

    return NextResponse.json({
      success: true,
      uptime: {
        percentage: uptimePercentage,
        avgResponseTime,
        history: uptimeHistory.map(row => ({
          status: row.status,
          response_time: row.response_time,
          timestamp: row.timestamp.toISOString()
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching website uptime:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch website uptime",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 