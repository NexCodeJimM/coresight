import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  console.log("Health check requested for server:", params.id);

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("Unauthorized access attempt");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    console.log("Fetching server details for ID:", id);

    // Get server details
    const [servers] = await pool.query("SELECT * FROM servers WHERE id = ?", [
      id,
    ]);

    if (!servers || (servers as any[]).length === 0) {
      console.log("Server not found:", id);
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const server = (servers as any[])[0];
    console.log("Server found:", server);

    // Try to ping the server's health endpoint using port 3001
    try {
      console.log(
        `Attempting to connect to ${server.ip_address}:3001/health` // Changed to use port 3001
      );

      const response = await fetch(
        `http://${server.ip_address}:3001/health`, // Changed to use port 3001
        {
          next: { revalidate: 0 },
          headers: {
            "Cache-Control": "no-cache",
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      console.log("Health check response status:", response.status);

      if (response.ok) {
        const healthData = await response.json();
        console.log("Health data received:", healthData);

        // Update server status in database
        await pool.query(
          `UPDATE server_uptime 
           SET status = 'online', last_checked = NOW()
           WHERE server_id = ?`,
          [id]
        );

        return NextResponse.json({
          success: true,
          status: "online",
          lastChecked: new Date(),
          system: healthData,
        });
      }
    } catch (error) {
      console.error(`Failed to ping server ${id}:`, error);
    }

    // If we reach here, server is offline
    console.log("Server is offline, updating status");
    await pool.query(
      `UPDATE server_uptime 
       SET status = 'offline', last_checked = NOW()
       WHERE server_id = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      status: "offline",
      lastChecked: new Date(),
      system: null,
    });
  } catch (error) {
    console.error("Error checking server health:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check server health",
        details: error,
      },
      { status: 500 }
    );
  }
}
