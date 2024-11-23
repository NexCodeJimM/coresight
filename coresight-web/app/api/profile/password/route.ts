import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: string;
  password: string;
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get current user's password
    const [rows] = await db.execute<UserRow[]>(
      'SELECT id, password FROM users WHERE id = ?',
      [session.user.id]
    );

    if (!rows.length) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isValid) {
      return new NextResponse("Current password is incorrect", { status: 400 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, session.user.id]
    );

    return new NextResponse("Password updated successfully");
  } catch (error) {
    console.error("[PASSWORD_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 