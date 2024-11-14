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

    // Use IP address instead of hostname for the request
    const targetAddress = server.ip_address || server.hostname;
    const url = `${config.API_URL}/api/metrics/${targetAddress}/history`;
    console.log("Requesting metrics history from:", url);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Accept: "application/json",
          "User-Agent": "CoreSight-Monitoring/1.0",
        },
        next: { revalidate: 0 },
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `Backend responded with ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error("Unexpected data format:", data);
        throw new Error("Invalid data format received from backend");
      }

      // Transform the data based on the requested type
      const transformedData = data.map((point: any) => ({
        timestamp: point.timestamp,
        cpu_usage: point.summary?.cpu?.current_usage ?? 0,
        memory_usage: point.summary?.memory?.percent_used ?? 0,
        disk_usage: point.summary?.disk?.percent_used ?? 0,
        network_in: (point.summary?.network?.bytes_recv_mb ?? 0) * 1024 * 1024,
        network_out: (point.summary?.network?.bytes_sent_mb ?? 0) * 1024 * 1024,
        cpu_temp: point.summary?.cpu?.temperature ?? 0,
        memory_active: point.summary?.memory?.total_gb
          ? ((point.summary.memory.total_gb *
              (point.summary.memory.percent_used ?? 0)) /
              100) *
            1024 *
            1024 *
            1024
          : 0,
        swap_used: point.summary?.memory?.swap_used ?? 0,
      }));

      return NextResponse.json(transformedData);
    } catch (error: unknown) {
      clearTimeout(timeoutId); // Clear timeout on error

      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Request timeout",
            details: "The request took too long to complete",
          },
          { status: 504 }
        );
      }
      throw error; // Re-throw other errors to be caught by outer try-catch
    }
  } catch (error: unknown) {
    console.error("Failed to fetch metrics history:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch metrics history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
