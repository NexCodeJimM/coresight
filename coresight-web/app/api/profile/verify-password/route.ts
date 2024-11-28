import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { compare } from "bcrypt";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  password: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    // Get user's current password hash
    const [rows] = await pool.query<UserRow[]>(
      "SELECT password FROM users WHERE id = ?",
      [session.user.id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify password
    const isValid = await compare(password, rows[0].password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify password" },
      { status: 500 }
    );
  }
} 