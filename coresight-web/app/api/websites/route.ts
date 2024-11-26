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
  category_id: string | null;
  category_name: string | null;
}

// GET all websites with categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [websites] = await pool.query<WebsiteRow[]>(
      `SELECT w.*, c.name as category_name 
       FROM monitored_websites w 
       LEFT JOIN website_categories c ON w.category_id = c.id 
       ORDER BY w.created_at DESC`
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
  const connection = await pool.getConnection();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, url, checkInterval, categoryId } = body;

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

    await connection.beginTransaction();

    // Generate UUID for the website
    const websiteId = require("crypto").randomUUID();

    // Initial ping to check if website is accessible
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const pingStart = Date.now();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CoreSight/1.0; +http://example.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      const pingEnd = Date.now();
      const responseTime = pingEnd - pingStart;
      const initialStatus = (response.status >= 200 && response.status < 400) ? 'up' : 'down';

      // Insert website with category
      await connection.query(
        `INSERT INTO monitored_websites (
          id, name, url, check_interval, status, 
          last_checked, response_time, category_id
        ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
        [websiteId, name, url, checkInterval, initialStatus, responseTime, categoryId || null]
      );

      // Insert uptime record
      await connection.query(
        `INSERT INTO website_uptime (
          id, website_id, status, response_time, timestamp
        ) VALUES (UUID(), ?, ?, ?, NOW())`,
        [websiteId, initialStatus, responseTime]
      );

    } catch (error) {
      // Try with http if https fails
      if (url.startsWith('https://')) {
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), 10000);
        const retryPingStart = Date.now();

        try {
          const httpUrl = url.replace('https://', 'http://');
          const response = await fetch(httpUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; CoreSight/1.0; +http://example.com)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            signal: retryController.signal,
            redirect: 'follow',
          });
          clearTimeout(retryTimeout);
          
          const pingEnd = Date.now();
          const responseTime = pingEnd - retryPingStart;
          const initialStatus = (response.status >= 200 && response.status < 400) ? 'up' : 'down';
          
          // Insert website with category
          await connection.query(
            `INSERT INTO monitored_websites (
              id, name, url, check_interval, status, 
              last_checked, response_time, category_id
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
            [websiteId, name, url, checkInterval, initialStatus, responseTime, categoryId || null]
          );

          // Insert uptime record
          await connection.query(
            `INSERT INTO website_uptime (
              id, website_id, status, response_time, timestamp
            ) VALUES (UUID(), ?, ?, ?, NOW())`,
            [websiteId, initialStatus, responseTime]
          );

        } catch (retryError) {
          // If both HTTPS and HTTP fail, create with down status
          await connection.query(
            `INSERT INTO monitored_websites (
              id, name, url, check_interval, status, 
              last_checked, category_id
            ) VALUES (?, ?, ?, ?, 'down', NOW(), ?)`,
            [websiteId, name, url, checkInterval, categoryId || null]
          );

          await connection.query(
            `INSERT INTO website_uptime (
              id, website_id, status, timestamp
            ) VALUES (UUID(), ?, 'down', NOW())`,
            [websiteId]
          );
        }
      } else {
        // If not HTTPS or HTTP fails, create with down status
        await connection.query(
          `INSERT INTO monitored_websites (
            id, name, url, check_interval, status, 
            last_checked, category_id
          ) VALUES (?, ?, ?, ?, 'down', NOW(), ?)`,
          [websiteId, name, url, checkInterval, categoryId || null]
        );

        await connection.query(
          `INSERT INTO website_uptime (
            id, website_id, status, timestamp
          ) VALUES (UUID(), ?, 'down', NOW())`,
          [websiteId]
        );
      }
    }

    await connection.commit();

    // Fetch the created website with category name
    const [websites] = await connection.query<WebsiteRow[]>(
      `SELECT w.*, c.name as category_name 
       FROM monitored_websites w 
       LEFT JOIN website_categories c ON w.category_id = c.id 
       WHERE w.id = ?`,
      [websiteId]
    );

    return NextResponse.json({
      success: true,
      website: websites[0],
    });

  } catch (error) {
    await connection.rollback();
    console.error("[WEBSITE_CREATE]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create website monitor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 