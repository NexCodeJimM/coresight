import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface CategoryRow extends RowDataPacket {
  id: string;
  name: string;
  created_at: Date;
}

// GET all categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [categories] = await pool.query<CategoryRow[]>(
      `SELECT * FROM website_categories ORDER BY name ASC`
    );

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("[CATEGORIES_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

// POST new category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Category name is required",
        },
        { status: 400 }
      );
    }

    // Check if category already exists
    const [existing] = await pool.query<CategoryRow[]>(
      'SELECT id FROM website_categories WHERE name = ?',
      [name.trim()]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Category already exists",
        },
        { status: 400 }
      );
    }

    // Insert new category
    const [result] = await pool.query(
      'INSERT INTO website_categories (id, name) VALUES (UUID(), ?)',
      [name.trim()]
    );

    // Fetch the created category
    const [categories] = await pool.query<CategoryRow[]>(
      'SELECT * FROM website_categories WHERE id = LAST_INSERT_ID()'
    );

    return NextResponse.json({
      success: true,
      category: categories[0],
    });
  } catch (error) {
    console.error("[CATEGORY_CREATE]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create category",
      },
      { status: 500 }
    );
  }
} 