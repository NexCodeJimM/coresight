import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  two_factor_enabled: boolean;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const [rows] = await pool.query<UserRow[]>(
      "SELECT two_factor_enabled FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      two_factor_enabled: Boolean(rows[0].two_factor_enabled),
    });
  } catch (error) {
    console.error("Error checking 2FA status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check 2FA status" },
      { status: 500 }
    );
  }
} 