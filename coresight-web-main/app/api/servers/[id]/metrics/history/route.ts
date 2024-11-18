import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "24");

    console.log(`Fetching ${hours}h metrics history for server ${params.id}`);

    // Query metrics directly from the database
    const [results] = await db.query(
      `SELECT 
        timestamp,
        cpu_usage,
        memory_usage,
        disk_usage,
        network_in,
        network_out,
        temperature as cpu_temp,
        memory_used as memory_active,
        disk_used as swap_used
       FROM server_metrics
       WHERE server_id = ? 
       AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY timestamp ASC
       LIMIT 1000`,
      [params.id, hours]
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching metrics history:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics history" },
      { status: 500 }
    );
  }
}
