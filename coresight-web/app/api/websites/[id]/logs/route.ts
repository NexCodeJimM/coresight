import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface LogRow extends RowDataPacket {
  id: string;
  website_id: string;
  status: "up" | "down";
  response_time: number | null;
  error_message: string | null;
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

    // Get the last 100 status changes
    const [logs] = await pool.query<LogRow[]>(
      `SELECT u1.* 
       FROM website_uptime u1
       LEFT JOIN website_uptime u2 
       ON u1.website_id = u2.website_id 
       AND u1.timestamp < u2.timestamp
       WHERE u1.website_id = ?
       ORDER BY u1.timestamp DESC
       LIMIT 100`,
      [id]
    );

    return NextResponse.json({
      success: true,
      logs: logs.map(log => ({
        id: log.id,
        status: log.status,
        response_time: log.response_time,
        error_message: log.error_message,
        timestamp: log.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching website logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch website logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 