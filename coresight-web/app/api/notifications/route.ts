import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface NotificationRow extends RowDataPacket {
  id: string;
  type: string;
  message: string;
  data: string;
  is_read: boolean;
  created_at: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get recent notifications
    const [rows] = await pool.query<NotificationRow[]>(`
      SELECT id, type, message, data, is_read, created_at
      FROM notifications
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const notifications = rows.map(row => ({
      id: row.id,
      type: row.type,
      message: row.message,
      data: JSON.parse(row.data || '{}'),
      is_read: Boolean(row.is_read),
      created_at: row.created_at.toISOString()
    }));

    return NextResponse.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, version, message } = body;

    if (type === 'update') {
      // Store update notification
      await pool.query(
        `INSERT INTO notifications (id, type, message, data)
         VALUES (UUID(), ?, ?, ?)`,
        ['update', `New version ${version} available`, JSON.stringify({ version })]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to handle notification" },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (notificationIds && notificationIds.length > 0) {
      await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE id IN (?)`,
        [notificationIds]
      );
    } else {
      // Mark all as read if no specific IDs provided
      await pool.query(`UPDATE notifications SET is_read = TRUE`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
} 