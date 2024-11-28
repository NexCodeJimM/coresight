import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from 'bcrypt';

interface UserRow extends RowDataPacket {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_admin: boolean;
  profile_picture: string | null;
  last_login: string | null;
  created_at: string;
  two_factor_enabled: boolean;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [rows] = await pool.query<UserRow[]>(
      `SELECT 
        id, 
        username,
        first_name,
        last_name, 
        email, 
        role,
        is_admin,
        profile_picture,
        last_login,
        created_at,
        two_factor_enabled
      FROM users 
      WHERE id = ?`,
      [params.id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.is_admin) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { username, first_name, last_name, email, role, is_admin, new_password } =
      await req.json();

    // Validate input
    if (!username || !email || !role || !first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (new_password) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(new_password, 10);
      
      // Update user with new password
      await pool.query(
        `UPDATE users 
         SET username = ?, 
             first_name = ?,
             last_name = ?,
             email = ?, 
             role = ?,
             is_admin = ?,
             password = ?
         WHERE id = ?`,
        [
          username,
          first_name,
          last_name,
          email,
          role,
          is_admin ? 1 : 0,
          hashedPassword,
          params.id,
        ]
      );
    } else {
      // Update user without changing password
      await pool.query(
        `UPDATE users 
         SET username = ?, 
             first_name = ?,
             last_name = ?,
             email = ?, 
             role = ?,
             is_admin = ?
         WHERE id = ?`,
        [
          username,
          first_name,
          last_name,
          email,
          role,
          is_admin ? 1 : 0,
          params.id,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.is_admin) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Check if user exists
    const [user] = await pool.query<UserRow[]>(
      "SELECT * FROM users WHERE id = ?",
      [params.id]
    );

    if (!user[0]) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Don't allow deleting the last admin
    if (user[0].is_admin) {
      const [adminCount] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM users WHERE is_admin = 1"
      );

      if (adminCount[0].count <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot delete the last administrator",
          },
          { status: 400 }
        );
      }
    }

    // Delete user
    await pool.query("DELETE FROM users WHERE id = ?", [params.id]);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
