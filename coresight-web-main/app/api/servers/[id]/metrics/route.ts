import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { cpu_usage, memory_usage, disk_usage, network_in, network_out } =
      body;

    // Update server's last_seen timestamp
    await db.query("UPDATE servers SET last_seen = NOW() WHERE id = ?", [
      params.id,
    ]);

    // Insert new metrics
    const [result] = await db.query(
      `INSERT INTO server_metrics 
       (server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [params.id, cpu_usage, memory_usage, disk_usage, network_in, network_out]
    );

    // Check for threshold alerts
    if (cpu_usage > 90 || memory_usage > 90 || disk_usage > 90) {
      await db.query(
        `INSERT INTO alerts (server_id, type, severity, message)
         VALUES (?, ?, 'high', ?)`,
        [
          params.id,
          cpu_usage > 90 ? "cpu" : memory_usage > 90 ? "memory" : "disk",
          `High ${
            cpu_usage > 90 ? "CPU" : memory_usage > 90 ? "memory" : "disk"
          } usage detected`,
        ]
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update metrics:", error);
    return NextResponse.json(
      { error: "Failed to update metrics" },
      { status: 500 }
    );
  }
}
