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

    // Get server details
    const [servers] = await pool.query("SELECT * FROM servers WHERE id = ?", [
      id,
    ]);

    if (!(servers as any[]).length) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const server = (servers as any[])[0];

    // Try to get real-time metrics from the server
    try {
      const response = await fetch(
        `http://${server.ip_address}:${server.port}/health`,
        {
          next: { revalidate: 0 },
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (response.ok) {
        const healthData = await response.json();

        // Store the new metrics
        await pool.query(
          `INSERT INTO server_metrics (
            id, server_id, cpu_usage, memory_usage, 
            disk_usage, network_usage, timestamp
          ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
          [
            id,
            healthData.cpu.usage,
            healthData.memory.usage,
            healthData.disk.usage,
            healthData.network?.usage || 0,
          ]
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
          current: {
            cpu_usage: healthData.cpu.usage,
            memory_usage: healthData.memory.usage,
            disk_usage: healthData.disk.usage,
            network_usage: healthData.network?.usage || 0,
            timestamp: new Date(),
          },
          history: historicalMetrics,
        });
      }
    } catch (error) {
      console.error("Error fetching real-time metrics:", error);
    }

    // If we reach here, return the latest stored metrics
    const [currentMetrics] = await pool.query(
      `SELECT * FROM server_metrics 
       WHERE server_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [id]
    );

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
