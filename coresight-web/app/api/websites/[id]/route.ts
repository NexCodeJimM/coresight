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
}

// GET single website
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

    const [websites] = await pool.query<WebsiteRow[]>(
      'SELECT * FROM monitored_websites WHERE id = ?',
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

// DELETE website
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    await pool.query('DELETE FROM monitored_websites WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: "Website deleted successfully",
    });
  } catch (error) {
    console.error("[WEBSITE_DELETE]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete website",
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
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
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

    await pool.query(
      `UPDATE monitored_websites 
       SET name = ?, url = ?, check_interval = ?
       WHERE id = ?`,
      [name, url, checkInterval, id]
    );

    const [websites] = await pool.query<WebsiteRow[]>(
      'SELECT * FROM monitored_websites WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      website: websites[0],
    });
  } catch (error) {
    console.error("[WEBSITE_UPDATE]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update website",
      },
      { status: 500 }
    );
  }
} 