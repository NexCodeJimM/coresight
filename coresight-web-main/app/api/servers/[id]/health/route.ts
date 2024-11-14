import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, get the server's IP address from the database
    const [servers] = await db.query(
      `SELECT hostname, ip_address, port FROM servers WHERE id = ?`,
      [params.id]
    );

    if (!Array.isArray(servers) || servers.length === 0) {
      throw new Error("Server not found");
    }

    const server = (servers as any)[0];
    const serverIP = server.ip_address;
    const port = server.port || "3000";

    // Try to reach the server's health endpoint
    try {
      const response = await fetch(`http://${serverIP}:${port}/health`, {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 10 }, // Cache for 10 seconds
      });

      if (!response.ok) {
        throw new Error(`Health check failed for ${serverIP}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error(`Health check failed for ${serverIP}:`, error);
      return NextResponse.json(
        { error: "Server is unreachable" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Failed to check server health:", error);
    return NextResponse.json(
      { error: "Failed to check server health" },
      { status: 500 }
    );
  }
}
