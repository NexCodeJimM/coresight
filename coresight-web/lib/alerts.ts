import pool from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function checkAndCreateAlerts(serverId: string, metrics: any) {
  try {
    // CPU Alert Thresholds
    if (metrics.cpu?.usage > 90) {
      await createAlert(
        serverId,
        "critical",
        `High CPU usage detected: ${metrics.cpu.usage.toFixed(1)}%`
      );
    } else if (metrics.cpu?.usage > 80) {
      await createAlert(
        serverId,
        "warning",
        `Elevated CPU usage: ${metrics.cpu.usage.toFixed(1)}%`
      );
    }

    // Memory Alert Thresholds
    if (metrics.memory?.usage > 90) {
      await createAlert(
        serverId,
        "critical",
        `High memory usage detected: ${metrics.memory.usage.toFixed(1)}%`
      );
    } else if (metrics.memory?.usage > 80) {
      await createAlert(
        serverId,
        "warning",
        `Elevated memory usage: ${metrics.memory.usage.toFixed(1)}%`
      );
    }

    // Disk Alert Thresholds
    if (metrics.disk?.usage > 90) {
      await createAlert(
        serverId,
        "critical",
        `High disk usage detected: ${metrics.disk.usage.toFixed(1)}%`
      );
    } else if (metrics.disk?.usage > 80) {
      await createAlert(
        serverId,
        "warning",
        `Elevated disk usage: ${metrics.disk.usage.toFixed(1)}%`
      );
    }
  } catch (error) {
    console.error("Error checking and creating alerts:", error);
  }
}

async function createAlert(
  serverId: string,
  severity: "critical" | "warning" | "info",
  message: string
) {
  try {
    // Check if a similar alert exists within the last hour
    const [existingAlerts] = await pool.query(
      `SELECT id FROM alerts 
       WHERE server_id = ? 
       AND message = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [serverId, message]
    );

    if ((existingAlerts as any[]).length === 0) {
      // Create new alert if no similar alert exists
      await pool.query(
        `INSERT INTO alerts (id, server_id, severity, message, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [uuidv4(), serverId, severity, message]
      );
    }
  } catch (error) {
    console.error("Error creating alert:", error);
  }
}
