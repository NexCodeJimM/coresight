import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get server details
    const [servers] = await db.query(
      "SELECT name, ip_address, hostname FROM servers WHERE id = ?",
      [params.id]
    );
    const server = (servers as any[])[0];

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Get history parameter
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "24");
    const type = searchParams.get("type") || "performance";

    try {
      // Fetch from monitoring backend
      const response = await fetch(
        `${config.API_URL}${config.METRICS_ENDPOINT}/${server.hostname}/history?hours=${hours}&type=${type}`
      );

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = await response.json();

      // Transform the data to match our interface
      const transformedData = data.map((metric: any) => ({
        timestamp: new Date(metric.timestamp).toISOString(),
        cpu_usage: metric.cpu.usage,
        memory_usage: metric.memory.percentage,
        disk_usage: metric.disk.percentage,
        network_in: metric.network.rx_bytes,
        network_out: metric.network.tx_bytes,
        disk_read: metric.disk.read_bytes,
        disk_write: metric.disk.write_bytes,
      }));

      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("Backend connection error:", error);
      throw new Error("Failed to connect to monitoring backend");
    }
  } catch (error) {
    console.error("Failed to fetch metrics history:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics history" },
      { status: 500 }
    );
  }
}
