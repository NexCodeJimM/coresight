import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  first_name: string;
  last_name: string;
  email: string;
  image: string | null;
  two_factor_enabled: boolean;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [rows] = await pool.query<UserRow[]>(
      `SELECT 
        first_name,
        last_name,
        email,
        profile_picture as image,
        two_factor_enabled
      FROM users 
      WHERE id = ?`,
      [session.user.id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...rows[0],
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { first_name, last_name, email, image } = await req.json();

    // Update user profile
    await pool.query(
      `UPDATE users 
       SET first_name = ?,
           last_name = ?,
           email = ?,
           profile_picture = ?
       WHERE id = ?`,
      [first_name, last_name, email, image, session.user.id]
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 