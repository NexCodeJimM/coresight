import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface UptimeRow extends RowDataPacket {
  status: "up" | "down";
  response_time: number | null;
  timestamp: Date;
  category_id: string | null;
  category_name: string | null;
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

    // Get uptime history with category information
    const [uptimeHistory] = await pool.query<UptimeRow[]>(
      `SELECT u.status, u.response_time, u.timestamp,
              w.category_id, c.name as category_name
       FROM website_uptime u
       JOIN monitored_websites w ON u.website_id = w.id
       LEFT JOIN website_categories c ON w.category_id = c.id
       WHERE u.website_id = ? 
       AND u.timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY u.timestamp ASC`,
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

    // Get the current category information
    const categoryInfo = uptimeHistory.length > 0 ? {
      category_id: uptimeHistory[0].category_id,
      category_name: uptimeHistory[0].category_name
    } : {
      category_id: null,
      category_name: null
    };

    return NextResponse.json({
      success: true,
      uptime: {
        percentage: uptimePercentage,
        avgResponseTime,
        category: categoryInfo,
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