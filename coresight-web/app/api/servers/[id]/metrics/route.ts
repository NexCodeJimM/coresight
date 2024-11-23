import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { checkAndCreateAlerts } from "@/lib/alerts";

interface MetricsRow extends RowDataPacket {
  id: string;
  server_id: string;
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  memory_used: number;
  disk_usage: number;
  disk_total: number;
  disk_used: number;
  network_in: number;
  network_out: number;
  timestamp: Date;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Fetch both current and historical data
    const [currentResponse, historyResponse] = await Promise.all([
      fetch(`${req.url}/current`),
      fetch(`${req.url}/history`),
    ]);

    const currentData = await currentResponse.json();
    const historyData = await historyResponse.json();

    return NextResponse.json({
      success: true,
      current: currentData.current,
      history: historyData.history,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const metrics = await req.json();

    // Store metrics in database
    await pool.query(
      `INSERT INTO server_metrics 
       (id, server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, timestamp)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        metrics.cpu?.usage || 0,
        metrics.memory?.usage || 0,
        metrics.disk?.usage || 0,
        metrics.network?.bytes_recv || 0,
        metrics.network?.bytes_sent || 0,
      ]
    );

    // Check and create alerts based on metrics
    await checkAndCreateAlerts(id, metrics);

    return NextResponse.json({
      success: true,
      message: "Metrics stored successfully",
    });
  } catch (error) {
    console.error("Error storing metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to store metrics",
      },
      { status: 500 }
    );
  }
}
