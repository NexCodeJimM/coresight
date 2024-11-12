import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [servers] = await db.query(
      "SELECT name, ip_address, hostname FROM servers WHERE id = ?",
      [params.id]
    );
    const server = (servers as any[])[0];

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const url = `${config.API_URL}/api/metrics/${server.hostname}`;
    console.log("Requesting health metrics from:", url);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("Received metrics:", data);

      // Transform data with safe fallbacks
      const transformedData = {
        cpu_usage: data?.summary?.cpu?.current_usage ?? 0,
        memory_usage: data?.summary?.memory?.percent_used ?? 0,
        memory_total: data?.summary?.memory?.total_gb * 1024 * 1024 * 1024 ?? 0,
        memory_used:
          ((data?.summary?.memory?.total_gb *
            data?.summary?.memory?.percent_used) /
            100) *
            1024 *
            1024 *
            1024 ?? 0,
        disk_usage: data?.summary?.disk?.percent_used ?? 0,
        disk_total: data?.summary?.disk?.total_gb * 1024 * 1024 * 1024 ?? 0,
        disk_used:
          ((data?.summary?.disk?.total_gb * data?.summary?.disk?.percent_used) /
            100) *
            1024 *
            1024 *
            1024 ?? 0,
        network: {
          bytes_sent: data?.summary?.network?.bytes_sent_mb * 1024 * 1024 ?? 0,
          bytes_recv: data?.summary?.network?.bytes_recv_mb * 1024 * 1024 ?? 0,
        },
        uptime: 0,
        is_connected: true,
        last_seen: data?.summary?.lastUpdate ?? new Date().toISOString(),
      };

      console.log("Transformed data:", transformedData);
      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("Backend request failed:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to fetch server health:", error);
    return NextResponse.json(
      {
        cpu_usage: 0,
        memory_usage: 0,
        memory_total: 0,
        memory_used: 0,
        disk_usage: 0,
        disk_total: 0,
        disk_used: 0,
        network: {
          bytes_sent: 0,
          bytes_recv: 0,
        },
        uptime: 0,
        is_connected: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch server health",
      },
      { status: 500 }
    );
  }
}
