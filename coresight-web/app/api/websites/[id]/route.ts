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
  category_id: string | null;
  category_name: string | null;
}

// GET website details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // Get website with category name
    const [websites] = await pool.query<WebsiteRow[]>(
      `SELECT w.*, c.name as category_name 
       FROM monitored_websites w 
       LEFT JOIN website_categories c ON w.category_id = c.id 
       WHERE w.id = ?`,
      [id]
    );

    if (!websites.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Website not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      website: websites[0],
    });
  } catch (error) {
    console.error("[WEBSITE_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch website",
      },
      { status: 500 }
    );
  }
}

// UPDATE website
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, url, checkInterval, category_id } = body;

    await connection.beginTransaction();

    // Update website details
    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (url) {
      updates.push("url = ?");
      values.push(url);
    }
    if (checkInterval !== undefined) {
      updates.push("check_interval = ?");
      values.push(checkInterval);
    }
    if (category_id !== undefined) {
      updates.push("category_id = ?");
      values.push(category_id || null);
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.query(
        `UPDATE monitored_websites 
         SET ${updates.join(", ")} 
         WHERE id = ?`,
        values
      );
    }

    await connection.commit();

    // Fetch updated website with category name
    const [websites] = await connection.query<WebsiteRow[]>(
      `SELECT w.*, c.name as category_name 
       FROM monitored_websites w 
       LEFT JOIN website_categories c ON w.category_id = c.id 
       WHERE w.id = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      website: websites[0],
    });

  } catch (error) {
    await connection.rollback();
    console.error("[WEBSITE_UPDATE]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update website",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// DELETE website
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    await connection.beginTransaction();

    // Delete website (uptime history will be deleted via ON DELETE CASCADE)
    await connection.query(
      'DELETE FROM monitored_websites WHERE id = ?',
      [id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Website deleted successfully",
    });

  } catch (error) {
    await connection.rollback();
    console.error("[WEBSITE_DELETE]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete website",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 