import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface MetricsResult extends RowDataPacket {
  totalServers: number;
  activeServers: number;
  totalAlerts: number;
  criticalAlerts: number;
}

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM servers) as totalServers,
        (SELECT COUNT(*) FROM servers WHERE status = 'active') as activeServers,
        (SELECT COUNT(*) FROM alerts WHERE status = 'active') as totalAlerts,
        (SELECT COUNT(*) FROM alerts WHERE status = 'active') as criticalAlerts
      FROM dual
    `);

    // Type assertion for the query result
    const results = rows as MetricsResult[];

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("No metrics data returned");
    }

    const metrics = {
      totalServers: results[0].totalServers || 0,
      activeServers: results[0].activeServers || 0,
      totalAlerts: results[0].totalAlerts || 0,
      criticalAlerts: results[0].totalAlerts || 0,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to fetch dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
