import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { RowDataPacket, FieldPacket } from "mysql2";

interface ServerRow extends RowDataPacket {
  name: string;
  ip_address: string;
  hostname: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get server details
    const [rows] = (await db.query(
      "SELECT name, ip_address, hostname FROM servers WHERE id = ?",
      [params.id]
    )) as [ServerRow[], FieldPacket[]];

    const server = rows[0];

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

      // Transform data with safe fallbacks and proper operator precedence
      const transformedData = {
        cpu_usage: data?.summary?.cpu?.current_usage ?? 0,
        memory_usage: data?.summary?.memory?.percent_used ?? 0,
        memory_total:
          (data?.summary?.memory?.total_gb ?? 0) * 1024 * 1024 * 1024,
        memory_used:
          (((data?.summary?.memory?.total_gb ?? 0) *
            (data?.summary?.memory?.percent_used ?? 0)) /
            100) *
          1024 *
          1024 *
          1024,
        disk_usage: data?.summary?.disk?.percent_used ?? 0,
        disk_total: (data?.summary?.disk?.total_gb ?? 0) * 1024 * 1024 * 1024,
        disk_used:
          (((data?.summary?.disk?.total_gb ?? 0) *
            (data?.summary?.disk?.percent_used ?? 0)) /
            100) *
          1024 *
          1024 *
          1024,
        network: {
          bytes_sent:
            (data?.summary?.network?.bytes_sent_mb ?? 0) * 1024 * 1024,
          bytes_recv:
            (data?.summary?.network?.bytes_recv_mb ?? 0) * 1024 * 1024,
        },
        uptime: 0,
        is_connected: true,
        last_seen: data?.summary?.lastUpdate ?? new Date().toISOString(),
      };

      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("Backend request failed:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to fetch server health:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch server health",
      },
      { status: 500 }
    );
  }
}
