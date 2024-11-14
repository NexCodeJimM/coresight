import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, get the server's IP address from the database
    const [servers] = await db.query(
      `SELECT hostname, ip_address FROM servers WHERE id = ?`,
      [params.id]
    );

    if (!Array.isArray(servers) || servers.length === 0) {
      throw new Error("Server not found");
    }

    const server = (servers as any)[0];
    const serverIP = server.ip_address; // Use IP address instead of hostname

    // Fetch processes using the server's IP address
    const response = await fetch(
      `http://${serverIP}:3000/api/metrics/local/processes`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 10 }, // Cache for 10 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch processes from ${serverIP}`);
    }

    const processes = await response.json();
    return NextResponse.json(processes);
  } catch (error) {
    console.error("Failed to fetch processes:", error);
    return NextResponse.json(
      { error: "Failed to fetch processes" },
      { status: 500 }
    );
  }
}
