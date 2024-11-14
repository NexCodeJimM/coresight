import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ServerRow extends RowDataPacket {
  id: string;
  name: string;
  hostname: string;
  ip_address: string;
  port: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.*,
        (
          SELECT COUNT(*) 
          FROM alerts 
          WHERE server_id = s.id AND status = 'active'
        ) as active_alerts
      FROM servers s
      ORDER BY s.created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch servers:", error);
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, hostname, ip_address, port } = body;

    // Validate required fields
    if (!name || !hostname || !ip_address) {
      return NextResponse.json(
        { error: "Name, hostname, and IP address are required" },
        { status: 400 }
      );
    }

    // Generate UUID for server ID
    const [uuidRows] = await db.query("SELECT UUID() as uuid");
    const uuidResult = (uuidRows as RowDataPacket[])[0] as { uuid: string };
    const serverId = uuidResult.uuid;

    // Insert new server with generated UUID
    await db.query(
      `INSERT INTO servers (id, name, hostname, ip_address, port, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [serverId, name, hostname, ip_address, port || "3000"]
    );

    // Get the inserted server
    const [serverRows] = await db.query(`SELECT * FROM servers WHERE id = ?`, [
      serverId,
    ]);
    const server = (serverRows as ServerRow[])[0];

    return NextResponse.json({
      message: "Server created successfully",
      server,
    });
  } catch (error) {
    console.error("Failed to create server:", error);
    return NextResponse.json(
      { error: "Failed to create server" },
      { status: 500 }
    );
  }
}
