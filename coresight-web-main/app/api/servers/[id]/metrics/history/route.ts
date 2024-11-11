import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log("Attempting to fetch:", url); // Debug log
      const response = await fetch(url);

      if (response.status === 404) {
        console.error("Endpoint not found:", url);
        throw new Error(`Endpoint not found: ${url}`);
      }

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error("Fetch attempt failed:", error);
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
}

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

    // Log server details for debugging
    console.log("Server details:", server);

    const url = `${config.API_URL}${config.HISTORY_ENDPOINT}/${server.hostname}`;
    console.log("Requesting URL:", url);

    try {
      const response = await fetchWithRetry(url);
      const data = await response.json();

      // Transform the data if needed
      const transformedData = Array.isArray(data)
        ? data.map((metric) => ({
            timestamp: new Date(metric.timestamp).toISOString(),
            cpu_usage: metric.cpu?.usage || 0,
            memory_usage: metric.memory?.percentage || 0,
            disk_usage: metric.disk?.percentage || 0,
            network_in: metric.network?.rx_bytes || 0,
            network_out: metric.network?.tx_bytes || 0,
          }))
        : [];

      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("Backend connection error:", error);
      throw new Error("Failed to connect to monitoring backend");
    }
  } catch (error) {
    console.error("Failed to fetch metrics history:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch metrics history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
