import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get total servers and change
    const [serverStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END) as new_servers
      FROM servers
      WHERE status = 'active'
    `);

    // Get average CPU usage and change
    const [cpuStats] = await pool.query(`
      SELECT 
        AVG(cpu_usage) as avg_cpu,
        AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR) 
            THEN cpu_usage ELSE NULL END) - 
        AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 2 HOUR) 
            AND timestamp < DATE_SUB(NOW(), INTERVAL 1 HOUR)
            THEN cpu_usage ELSE NULL END) as cpu_change
      FROM server_metrics
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
    `);

    // Get average storage usage and change
    const [storageStats] = await pool.query(`
      SELECT 
        AVG(disk_usage) as avg_storage,
        AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 1 WEEK) 
            THEN disk_usage ELSE NULL END) - 
        AVG(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 2 WEEK) 
            AND timestamp < DATE_SUB(NOW(), INTERVAL 1 WEEK)
            THEN disk_usage ELSE NULL END) as storage_change
      FROM server_metrics
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 2 WEEK)
    `);

    // Get active alerts and change
    const [alertStats] = await pool.query(`
      SELECT 
        COUNT(*) as active_alerts,
        COUNT(*) - (
          SELECT COUNT(*) 
          FROM alerts 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 2 DAY)
          AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)
          AND status = 'active'
        ) as alerts_change
      FROM alerts
      WHERE status = 'active'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    `);

    const stats = {
      totalServers: (serverStats as any)[0].total || 0,
      serversChange: (serverStats as any)[0].new_servers || 0,
      averageCpu: (cpuStats as any)[0].avg_cpu || 0,
      cpuChange: (cpuStats as any)[0].cpu_change || 0,
      averageStorage: (storageStats as any)[0].avg_storage || 0,
      storageChange: (storageStats as any)[0].storage_change || 0,
      activeAlerts: (alertStats as any)[0].active_alerts || 0,
      alertsChange: (alertStats as any)[0].alerts_change || 0,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard stats",
      },
      { status: 500 }
    );
  }
}
