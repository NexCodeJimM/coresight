import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get server details
    const [servers] = await db.query(
      `SELECT id, name, hostname, ip_address, port FROM servers WHERE id = ?`,
      [params.id]
    );

    if (!Array.isArray(servers) || servers.length === 0) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const server = (servers as any)[0];
    const serverIP = server.ip_address || server.hostname;
    const port = server.port || "3000";

    console.log(`Fetching uptime for server: ${serverIP}:${port}`);

    // Get uptime data from the server
    try {
      const uptimeUrl = `http://${serverIP}:${port}/api/metrics/${serverIP}/uptime`;
      console.log(`Requesting uptime from: ${uptimeUrl}`);

      const response = await fetch(uptimeUrl, {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch uptime: ${response.status}`);
      }

      const uptimeData = await response.json();
      console.log("Received uptime data:", uptimeData);

      // Get the server's status from the database
      const [serverStatus] = await db.query(
        `SELECT status, last_checked, last_downtime, uptime 
         FROM server_uptime 
         WHERE server_id = ?`,
        [server.id]
      );

      // Transform and combine the data
      const transformedData = {
        serverId: server.id,
        serverName: server.name,
        status: uptimeData.status || "offline",
        lastChecked: uptimeData.last_checked || new Date().toISOString(),
        uptime: uptimeData.uptime || 0,
        lastDowntime:
          uptimeData.last_downtime || (serverStatus as any[])[0]?.last_downtime,
      };

      console.log("Transformed uptime data:", transformedData);

      // Update the database with the latest uptime information
      await db.query(
        `INSERT INTO server_uptime 
         (server_id, status, last_checked, uptime, last_downtime)
         VALUES (?, ?, NOW(), ?, ?)
         ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         last_checked = VALUES(last_checked),
         uptime = VALUES(uptime),
         last_downtime = COALESCE(VALUES(last_downtime), last_downtime)`,
        [
          server.id,
          transformedData.status,
          transformedData.uptime,
          transformedData.lastDowntime,
        ]
      );

      return NextResponse.json(transformedData);
    } catch (error) {
      console.error(`Failed to fetch uptime for ${serverIP}:`, error);

      // Return offline status if server is unreachable
      return NextResponse.json({
        serverId: server.id,
        serverName: server.name,
        status: "offline",
        lastChecked: new Date().toISOString(),
        uptime: 0,
        lastDowntime: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error in uptime route:", error);
    return NextResponse.json(
      {
        error: "Failed to get server uptime",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
