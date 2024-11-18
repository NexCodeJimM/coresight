import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

interface ServerMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network: {
    upload_rate: number;
    download_rate: number;
    total_rate: number;
  };
  timestamp: string;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Get server details
    const [servers] = await pool.query("SELECT * FROM servers WHERE id = ?", [
      id,
    ]);

    if (!(servers as any[]).length) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const server = (servers as any[])[0];

    // Try to get real-time metrics
    try {
      const response = await fetch(
        `http://${server.ip_address}:${server.port}/health`,
        {
          next: { revalidate: 0 },
          headers: { "Cache-Control": "no-cache" },
        }
      );

      if (response.ok) {
        const healthData = await response.json();

        // Store new metrics in database
        await storeMetrics(id, healthData);

        // Get historical metrics for the past week
        const historicalMetrics = await getHistoricalMetrics(id);

        return NextResponse.json({
          success: true,
          current: formatMetrics(healthData),
          history: historicalMetrics,
        });
      }
    } catch (error) {
      console.error("Error fetching real-time metrics:", error);
    }

    // Fallback to latest stored metrics if real-time fetch fails
    const [currentMetrics] = await pool.query(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [id]
    );

    const historicalMetrics = await getHistoricalMetrics(id);

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

// Helper function to format timestamp
function formatTimestamp(timestamp: Date) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper function to get historical metrics
async function getHistoricalMetrics(serverId: string) {
  const [metrics] = await pool.query(
    `SELECT 
      id,
      server_id,
      cpu_usage,
      memory_usage,
      disk_usage,
      network_usage,
      DATE_FORMAT(timestamp, '%Y-%m-%dT%H:%i:%s.000Z') as timestamp
     FROM server_metrics 
     WHERE server_id = ? 
     AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY timestamp ASC`,
    [serverId]
  );

  // Format timestamps for all metrics
  return (metrics as any[]).map((metric) => ({
    ...metric,
    timestamp: formatTimestamp(new Date(metric.timestamp)),
  }));
}

// Helper function to store new metrics
async function storeMetrics(serverId: string, healthData: any) {
  await pool.query(
    `INSERT INTO server_metrics (
      id, server_id, cpu_usage, memory_usage, 
      disk_usage, network_usage, timestamp
    ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
    [
      serverId,
      healthData.cpu.usage,
      healthData.memory.usage,
      healthData.disk.usage,
      healthData.network?.usage || 0,
    ]
  );
}

// Helper function to format metrics
function formatMetrics(healthData: any): ServerMetrics {
  return {
    cpu_usage: healthData.cpu.usage,
    memory_usage: healthData.memory.usage,
    disk_usage: healthData.disk.usage,
    network: {
      upload_rate: healthData.network?.upload_rate || 0,
      download_rate: healthData.network?.download_rate || 0,
      total_rate: healthData.network?.total_rate || 0,
    },
    timestamp: formatTimestamp(new Date()),
  };
}
