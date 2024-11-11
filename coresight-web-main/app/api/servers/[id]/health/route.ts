import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }
      return response;
    } catch (error) {
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
    const [servers] = await db.query(
      "SELECT name, ip_address, hostname FROM servers WHERE id = ?",
      [params.id]
    );
    const server = (servers as any[])[0];

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    try {
      const response = await fetchWithRetry(
        `${config.API_URL}${config.METRICS_ENDPOINT}/${server.hostname}`
      );
      const data = await response.json();

      return NextResponse.json({
        ...data,
        is_connected: true,
      });
    } catch (error) {
      console.error("Backend connection error:", error);
      throw new Error("Failed to connect to monitoring backend");
    }
  } catch (error) {
    console.error("Failed to fetch server health:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch server health",
        is_connected: false,
      },
      { status: 500 }
    );
  }
}
