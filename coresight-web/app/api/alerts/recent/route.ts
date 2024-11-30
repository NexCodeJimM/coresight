import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface AlertRow extends RowDataPacket {
  id: string;
  server_id: string | null;
  website_id: string | null;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'website';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'resolved';
  created_at: Date;
  resolved_at: Date | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get recent alerts with server and website names
    const [rows] = await pool.query<AlertRow[]>(`
      SELECT 
        a.*,
        s.name as server_name,
        w.name as website_name
      FROM alerts a
      LEFT JOIN servers s ON a.server_id = s.id
      LEFT JOIN monitored_websites w ON a.website_id = w.id
      WHERE a.status = 'active'
      AND (
        a.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        OR a.severity = 'critical'
      )
      ORDER BY 
        CASE 
          WHEN a.severity = 'critical' THEN 1
          WHEN a.severity = 'high' THEN 2
          WHEN a.severity = 'medium' THEN 3
          ELSE 4
        END,
        a.created_at DESC
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      alerts: rows,
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
