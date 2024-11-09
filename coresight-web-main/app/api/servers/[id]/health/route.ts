import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the server hostname from the database
    const [servers] = await db.query(
      "SELECT name, ip_address, hostname FROM servers WHERE id = ?",
      [params.id]
    );
    const server = (servers as any[])[0];

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    try {
      // Fetch from the monitoring backend
      const response = await fetch(
        `${config.API_URL}${config.HEALTH_ENDPOINT}/${server.hostname}`
      );

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = await response.json();

      // Transform the data to match our interface
      return NextResponse.json({
        cpu_usage: data.cpu.usage,
        memory_usage: data.memory.percentage,
        disk_usage: data.disk.percentage,
        uptime: data.uptime,
        total_memory: data.memory.total,
        total_disk: data.disk.total,
        used_memory: data.memory.used,
        used_disk: data.disk.used,
        is_connected: true,
        network_in: data.network.rx_bytes,
        network_out: data.network.tx_bytes,
      });
    } catch (error) {
      console.error("Backend connection error:", error);
      throw new Error("Failed to connect to monitoring backend");
    }
  } catch (error) {
    console.error("Failed to fetch server health:", error);
    return NextResponse.json(
      {
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        uptime: 0,
        total_memory: 0,
        total_disk: 0,
        used_memory: 0,
        used_disk: 0,
        is_connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
