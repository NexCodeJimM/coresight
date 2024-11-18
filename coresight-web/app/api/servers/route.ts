import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [servers] = await pool.query(`
      SELECT 
        s.*,
        su.uptime,
        su.status as current_status,
        su.last_checked as last_seen
      FROM servers s
      LEFT JOIN server_uptime su ON s.id = su.server_id
      ORDER BY s.created_at DESC
    `);

    return NextResponse.json(servers);
  } catch (error) {
    console.error("Error fetching servers:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const data = await req.json();
    const serverId = uuidv4();

    await pool.query(
      `INSERT INTO servers (
        id, name, ip_address, hostname, description, 
        port, org, bucket, token, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        serverId,
        data.name,
        data.ip_address,
        data.hostname,
        data.description,
        data.port,
        data.org,
        data.bucket,
        data.token,
      ]
    );

    // Initialize server uptime record
    await pool.query(
      `INSERT INTO server_uptime (server_id, status, last_checked, uptime)
       VALUES (?, 'offline', NOW(), 0)`,
      [serverId]
    );

    return new NextResponse("Server created successfully", { status: 201 });
  } catch (error) {
    console.error("Error creating server:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
