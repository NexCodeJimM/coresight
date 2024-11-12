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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "performance";

    const url = `${config.API_URL}/api/metrics/${server.hostname}/history`;
    console.log("Requesting metrics history from:", url);

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

    // Transform the data based on the requested type
    const transformedData = data.map((point: any) => ({
      timestamp: point.timestamp,
      cpu_usage: point.summary.cpu.current_usage || 0,
      memory_usage: point.summary.memory.percent_used || 0,
      disk_usage: point.summary.disk.percent_used || 0,
      network_in: point.summary.network.bytes_recv_mb * 1024 * 1024 || 0,
      network_out: point.summary.network.bytes_sent_mb * 1024 * 1024 || 0,
      cpu_temp: point.summary.cpu.temperature || 0,
      memory_active:
        ((point.summary.memory.total_gb * point.summary.memory.percent_used) /
          100) *
          1024 *
          1024 *
          1024 || 0,
      swap_used: point.summary.memory.swap_used || 0,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Failed to fetch metrics history:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics history" },
      { status: 500 }
    );
  }
}
