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

// DELETE category
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

    // Update websites to remove category
    await connection.query(
      'UPDATE monitored_websites SET category_id = NULL WHERE category_id = ?',
      [id]
    );

    // Delete the category
    await connection.query(
      'DELETE FROM website_categories WHERE id = ?',
      [id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("[CATEGORY_DELETE]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete category",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// UPDATE category
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

    // Check if category with new name already exists
    const [existing] = await pool.query<CategoryRow[]>(
      'SELECT id FROM website_categories WHERE name = ? AND id != ?',
      [name.trim(), id]
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

    // Update category
    await pool.query(
      'UPDATE website_categories SET name = ? WHERE id = ?',
      [name.trim(), id]
    );

    // Fetch updated category
    const [categories] = await pool.query<CategoryRow[]>(
      'SELECT * FROM website_categories WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      category: categories[0],
    });
  } catch (error) {
    console.error("[CATEGORY_UPDATE]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update category",
      },
      { status: 500 }
    );
  }
} 