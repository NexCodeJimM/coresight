import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get total servers count
    const [totalServersResult] = await db.query(
      "SELECT COUNT(*) as count FROM servers"
    );
    const totalServers = (totalServersResult as any)[0].count;

    // Get active servers count (seen in last 5 minutes)
    const [activeServersResult] = await db.query(
      "SELECT COUNT(*) as count FROM servers WHERE last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE) AND status = 'active'"
    );
    const activeServers = (activeServersResult as any)[0].count;

    // Get total alerts count
    const [totalAlertsResult] = await db.query(
      "SELECT COUNT(*) as count FROM alerts WHERE status = 'active'"
    );
    const totalAlerts = (totalAlertsResult as any)[0].count;

    // Get critical alerts count
    const [criticalAlertsResult] = await db.query(
      "SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical' AND status = 'active'"
    );
    const criticalAlerts = (criticalAlertsResult as any)[0].count;

    return NextResponse.json({
      totalServers,
      activeServers,
      totalAlerts,
      criticalAlerts,
    });
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
