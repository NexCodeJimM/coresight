import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface WebsiteRow extends RowDataPacket {
  id: string;
  name: string;
  url: string;
  check_interval: number;
  status: "up" | "down";
  last_checked: Date | null;
  response_time: number | null;
  created_at: Date;
  updated_at: Date;
}

// GET all websites
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [websites] = await pool.query<WebsiteRow[]>(
      `SELECT * FROM monitored_websites ORDER BY created_at DESC`
    );

    return NextResponse.json({
      success: true,
      websites,
    });
  } catch (error) {
    console.error("[WEBSITES_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch websites",
      },
      { status: 500 }
    );
  }
}

// POST new website
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, url, checkInterval } = body;

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        },
        { status: 400 }
      );
    }

    // Initial ping to check if website is accessible
    try {
      const pingStart = Date.now();
      const response = await fetch(url, { method: 'HEAD' });
      const pingEnd = Date.now();
      const responseTime = pingEnd - pingStart;
      const initialStatus = response.ok ? 'up' : 'down';

      // Insert website with initial status
      const [result] = await pool.query(
        `INSERT INTO monitored_websites (
          id, name, url, check_interval, status, 
          last_checked, response_time
        ) VALUES (UUID(), ?, ?, ?, ?, NOW(), ?)`,
        [name, url, checkInterval, initialStatus, responseTime]
      );

      // Record first uptime entry
      await pool.query(
        `INSERT INTO website_uptime (
          id, website_id, status, response_time
        ) VALUES (UUID(), LAST_INSERT_ID(), ?, ?)`,
        [initialStatus, responseTime]
      );

      // Fetch the created website
      const [websites] = await pool.query<WebsiteRow[]>(
        'SELECT * FROM monitored_websites WHERE id = LAST_INSERT_ID()'
      );

      return NextResponse.json({
        success: true,
        website: websites[0],
      });

    } catch (error) {
      // If initial ping fails, create website with down status
      const [result] = await pool.query(
        `INSERT INTO monitored_websites (
          id, name, url, check_interval, status, 
          last_checked
        ) VALUES (UUID(), ?, ?, ?, 'down', NOW())`,
        [name, url, checkInterval]
      );

      // Record first downtime entry
      await pool.query(
        `INSERT INTO website_uptime (
          id, website_id, status
        ) VALUES (UUID(), LAST_INSERT_ID(), 'down')`
      );

      const [websites] = await pool.query<WebsiteRow[]>(
        'SELECT * FROM monitored_websites WHERE id = LAST_INSERT_ID()'
      );

      return NextResponse.json({
        success: true,
        website: websites[0],
      });
    }

  } catch (error) {
    console.error("[WEBSITE_CREATE]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create website monitor",
      },
      { status: 500 }
    );
  }
} 