import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Get current server status
    const [servers] = await db.query(
      "SELECT status FROM servers WHERE id = ?",
      [params.id]
    );
    const server = (servers as any[])[0];

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    let newStatus: string;
    let message: string;

    switch (action) {
      case "start":
        newStatus = "active";
        message = "Server started successfully";
        break;
      case "stop":
        newStatus = "inactive";
        message = "Server stopped successfully";
        break;
      case "restart":
        newStatus = "active";
        message = "Server restarted successfully";
        break;
      case "maintenance":
        newStatus = "maintenance";
        message = "Server placed in maintenance mode";
        break;
      case "check":
        // Perform health check without changing status
        await db.query(
          `INSERT INTO alerts (server_id, type, severity, message)
           SELECT ?, 
             CASE 
               WHEN cpu_usage > 90 THEN 'cpu'
               WHEN memory_usage > 90 THEN 'memory'
               WHEN disk_usage > 90 THEN 'disk'
               ELSE 'system'
             END,
             CASE 
               WHEN cpu_usage > 95 OR memory_usage > 95 OR disk_usage > 95 THEN 'critical'
               WHEN cpu_usage > 90 OR memory_usage > 90 OR disk_usage > 90 THEN 'high'
               ELSE 'medium'
             END,
             CONCAT('Health check: ', 
               CASE 
                 WHEN cpu_usage > 90 THEN 'High CPU usage'
                 WHEN memory_usage > 90 THEN 'High memory usage'
                 WHEN disk_usage > 90 THEN 'High disk usage'
                 ELSE 'System check completed'
               END
             )
           FROM server_metrics
           WHERE server_id = ?
           ORDER BY timestamp DESC
           LIMIT 1`,
          [params.id, params.id]
        );
        return NextResponse.json({ message: "Health check completed" });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update server status
    await db.query(
      "UPDATE servers SET status = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, params.id]
    );

    // Log the action
    await db.query(
      `INSERT INTO server_actions (server_id, action, performed_by)
       VALUES (?, ?, ?)`,
      [params.id, action, session.user.email]
    );

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Failed to perform server action:", error);
    return NextResponse.json(
      { error: "Failed to perform server action" },
      { status: 500 }
    );
  }
}
