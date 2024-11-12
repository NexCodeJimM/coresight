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

    // Transform the data to match the frontend's expected format
    const transformedData = {
      cpu_usage: data.cpu.usage.user + data.cpu.usage.system,
      memory_usage: data.memory.percentage,
      memory_total: data.memory.total,
      memory_used: data.memory.used,
      disk_usage: data.disk.io?.util_percentage || 0,
      disk_total: data.system.totalmem,
      disk_used: data.system.totalmem - data.system.freemem,
      uptime: data.system.uptime,
      is_connected: true,
      last_seen: data.timestamp,
    };

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
        uptime: 0,
        is_connected: false,
        error: "Failed to fetch server health",
      },
      { status: 500 }
    );
  }
}
