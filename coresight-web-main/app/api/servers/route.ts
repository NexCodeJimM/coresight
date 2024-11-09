import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const [servers] = await db.query(
      `SELECT 
        s.*,
        (
          SELECT COUNT(*) 
          FROM alerts 
          WHERE server_id = s.id AND status = 'active'
        ) as active_alerts
      FROM servers s 
      ORDER BY s.name ASC`
    );

    return NextResponse.json(servers);
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
    const session = await getServerSession(authOptions);
    console.log("Current session:", session); // Debug log

    // Allow all users to create servers temporarily
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { name, ip_address, hostname } = body;

    if (!name || !ip_address || !hostname) {
      return NextResponse.json(
        { error: "Name, IP address, and hostname are required" },
        { status: 400 }
      );
    }

    // Create server with UUID and hostname
    const [result] = await db.query(
      `INSERT INTO servers (id, name, ip_address, hostname) 
       VALUES (UUID(), ?, ?, ?)`,
      [name, ip_address, hostname]
    );

    // Log the action
    if (session?.user?.email) {
      await db.query(
        `INSERT INTO server_actions (server_id, action, performed_by)
         SELECT id, 'create', ? FROM servers WHERE name = ?`,
        [session.user.email, name]
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create server:", error);
    return NextResponse.json(
      { error: "Failed to create server" },
      { status: 500 }
    );
  }
}
