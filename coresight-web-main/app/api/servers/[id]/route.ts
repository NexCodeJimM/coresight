import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";

// GET server details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [servers] = await db.query(
      `SELECT 
        s.*,
        (
          SELECT COUNT(*) 
          FROM alerts 
          WHERE server_id = s.id AND status = 'active'
        ) as active_alerts,
        (
          SELECT JSON_OBJECT(
            'cpu_usage', sm.cpu_usage,
            'memory_usage', sm.memory_usage,
            'disk_usage', sm.disk_usage,
            'network_in', sm.network_in,
            'network_out', sm.network_out,
            'timestamp', sm.timestamp
          )
          FROM server_metrics sm
          WHERE sm.server_id = s.id
          ORDER BY sm.timestamp DESC
          LIMIT 1
        ) as latest_metrics
      FROM servers s 
      WHERE s.id = ?`,
      [params.id]
    );

    const server = (servers as any[])[0];
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return NextResponse.json(server);
  } catch (error) {
    console.error("Failed to fetch server:", error);
    return NextResponse.json(
      { error: "Failed to fetch server" },
      { status: 500 }
    );
  }
}

// UPDATE server
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, ip_address, status } = body;

    // Validate status
    const validStatuses = ["active", "inactive", "maintenance"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (ip_address) {
      updates.push("ip_address = ?");
      values.push(ip_address);
    }
    if (status) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(params.id);

    const [result] = await db.query(
      `UPDATE servers 
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = ?`,
      values
    );

    // Log the action
    await db.query(
      `INSERT INTO server_actions (server_id, action, performed_by)
       VALUES (?, 'update', ?)`,
      [params.id, session.user.email]
    );

    return NextResponse.json({ message: "Server updated successfully" });
  } catch (error) {
    console.error("Failed to update server:", error);
    return NextResponse.json(
      { error: "Failed to update server" },
      { status: 500 }
    );
  }
}

// DELETE server
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if server exists
    const [servers] = await db.query("SELECT id FROM servers WHERE id = ?", [
      params.id,
    ]);

    if ((servers as any[]).length === 0) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Delete related records first (due to foreign key constraints)
    await db.query("DELETE FROM server_metrics WHERE server_id = ?", [
      params.id,
    ]);
    await db.query("DELETE FROM alerts WHERE server_id = ?", [params.id]);
    await db.query("DELETE FROM server_actions WHERE server_id = ?", [
      params.id,
    ]);

    // Finally, delete the server
    const [result] = await db.query("DELETE FROM servers WHERE id = ?", [
      params.id,
    ]);

    return NextResponse.json({ message: "Server deleted successfully" });
  } catch (error) {
    console.error("Failed to delete server:", error);
    return NextResponse.json(
      { error: "Failed to delete server" },
      { status: 500 }
    );
  }
}

// Add PUT method to handle server updates
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const [result] = await db.query(
      `UPDATE servers 
       SET name = ?, hostname = ?, ip_address = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, hostname, ip_address, params.id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Server updated successfully",
      server: { id: params.id, name, hostname, ip_address },
    });
  } catch (error) {
    console.error("Failed to update server:", error);
    return NextResponse.json(
      { error: "Failed to update server settings" },
      { status: 500 }
    );
  }
}
