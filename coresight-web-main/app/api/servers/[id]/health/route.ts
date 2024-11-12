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

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    console.log("Received metrics:", data);

    // Transform data with new metrics
    const transformedData = {
      cpu_usage: data.cpu.usage.total || 0,
      cpu_cores: data.cpu.cores || [],
      cpu_temp: data.cpu.temperature.main || 0,
      memory_usage: data.memory.percentage || 0,
      memory_total: data.memory.total || 0,
      memory_used: data.memory.used || 0,
      memory_active: data.memory.active || 0,
      memory_available: data.memory.available || 0,
      swap_total: data.memory.swap.total || 0,
      swap_used: data.memory.swap.used || 0,
      disk_usage: data.disk.volumes[0]?.percentage || 0,
      disk_total: data.disk.io.total || 0,
      disk_used: data.disk.io.used || 0,
      disk_volumes: data.disk.volumes || [],
      network_interfaces: data.network.interfaces || [],
      processes: {
        total: data.processes.all || 0,
        running: data.processes.running || 0,
        top: data.processes.top || [],
      },
      is_connected: true,
      last_seen: data.timestamp,
    };

    console.log("Transformed data:", transformedData);
    return NextResponse.json(transformedData);
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
        network_in: 0,
        network_out: 0,
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
