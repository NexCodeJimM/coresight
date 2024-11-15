import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, get the server's IP address from the database
    const [servers] = await db.query(
      `SELECT name, hostname, ip_address, port FROM servers WHERE id = ?`,
      [params.id]
    );

    if (!Array.isArray(servers) || servers.length === 0) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const server = (servers as any)[0];
    const serverIP = server.ip_address || server.hostname;
    const port = server.port || "3000";

    console.log(`Checking health for server: ${serverIP}:${port}`);

    // Try to reach the server's health endpoint
    try {
      const healthUrl = `http://${serverIP}:${port}/health`;
      console.log(`Requesting health from: ${healthUrl}`);

      const response = await fetch(healthUrl, {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          "User-Agent": "CoreSight-Monitoring/1.0",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error(`Health check failed with status: ${response.status}`);
        throw new Error(`Health check failed with status: ${response.status}`);
      }

      const data = await response.json();

      // Also fetch metrics to include in health check
      const metricsUrl = `http://${serverIP}:${port}/api/metrics/local`;
      const metricsResponse = await fetch(metricsUrl, {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });

      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json();

        return NextResponse.json({
          status: "online",
          lastChecked: new Date().toISOString(),
          server: {
            name: server.name,
            ip: serverIP,
            port: port,
          },
          metrics: {
            cpu: metrics.summary?.cpu?.current_usage || 0,
            memory: metrics.summary?.memory?.percent_used || 0,
            memory_total: metrics.summary?.memory?.total || 0,
            memory_used: metrics.summary?.memory?.used || 0,
            disk: metrics.summary?.disk?.percent_used || 0,
            disk_total: metrics.summary?.disk?.total || 0,
            disk_used: metrics.summary?.disk?.used || 0,
            network: {
              in: metrics.summary?.network?.bytes_recv_sec || 0,
              out: metrics.summary?.network?.bytes_sent_sec || 0,
            },
          },
          system: data.system || {},
        });
      }

      // If metrics fetch fails, return basic health status
      return NextResponse.json({
        status: "online",
        lastChecked: new Date().toISOString(),
        server: {
          name: server.name,
          ip: serverIP,
          port: port,
        },
        system: data.system || {},
      });
    } catch (error) {
      console.error(`Health check failed for ${serverIP}:`, error);
      return NextResponse.json(
        {
          status: "offline",
          error: "Server is unreachable",
          details: error instanceof Error ? error.message : "Unknown error",
          server: {
            name: server.name,
            ip: serverIP,
            port: port,
          },
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Failed to check server health:", error);
    return NextResponse.json(
      {
        error: "Failed to check server health",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
