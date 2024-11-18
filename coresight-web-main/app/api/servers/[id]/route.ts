import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [servers] = await db.query(
      `SELECT id, name, ip_address, port, hostname, status, last_seen 
       FROM servers WHERE id = ?`,
      [params.id]
    );

    const server = (servers as any[])[0];
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    console.log("Server info:", {
      id: server.id,
      ip: server.ip_address,
      port: server.port,
    });

    return NextResponse.json(server);
  } catch (error) {
    console.error("Failed to fetch server:", error);
    return NextResponse.json(
      { error: "Failed to fetch server information" },
      { status: 500 }
    );
  }
}
