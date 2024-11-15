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
      "SELECT name, ip_address, hostname, port FROM servers WHERE id = ?",
      [params.id]
    );
    const server = (servers as any[])[0];

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const serverIP = server.ip_address || server.hostname;
    const port = server.port || "3000";
    const url = `http://${serverIP}:${port}/api/metrics/local`;

    console.log(`Fetching metrics from: ${url}`);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.status}`);
    }

    const data = await response.json();

    // Update server's last_seen timestamp and metrics
    await db.query(
      `UPDATE servers 
       SET last_seen = NOW(),
           cpu_usage = ?,
           memory_usage = ?,
           disk_usage = ?,
           network_in = ?,
           network_out = ?
       WHERE id = ?`,
      [
        data.summary?.cpu?.current_usage || 0,
        data.summary?.memory?.percent_used || 0,
        data.summary?.disk?.percent_used || 0,
        data.summary?.network?.bytes_recv_sec || 0,
        data.summary?.network?.bytes_sent_sec || 0,
        params.id,
      ]
    );

    // Insert metrics history
    await db.query(
      `INSERT INTO server_metrics 
       (server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.id,
        data.summary?.cpu?.current_usage || 0,
        data.summary?.memory?.percent_used || 0,
        data.summary?.disk?.percent_used || 0,
        data.summary?.network?.bytes_recv_sec || 0,
        data.summary?.network?.bytes_sent_sec || 0,
      ]
    );

    // Check for threshold alerts
    const cpuUsage = data.summary?.cpu?.current_usage || 0;
    const memoryUsage = data.summary?.memory?.percent_used || 0;
    const diskUsage = data.summary?.disk?.percent_used || 0;

    if (cpuUsage > 90 || memoryUsage > 90 || diskUsage > 90) {
      await db.query(
        `INSERT INTO alerts (server_id, type, severity, message)
         VALUES (?, ?, 'high', ?)`,
        [
          params.id,
          cpuUsage > 90 ? "cpu" : memoryUsage > 90 ? "memory" : "disk",
          `High ${
            cpuUsage > 90 ? "CPU" : memoryUsage > 90 ? "memory" : "disk"
          } usage detected (${
            cpuUsage > 90
              ? cpuUsage
              : memoryUsage > 90
              ? memoryUsage
              : diskUsage
          }%)`,
        ]
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch or update metrics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch or update metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

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
