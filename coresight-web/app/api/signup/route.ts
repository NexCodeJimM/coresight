import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { username, email, password, role } = await req.json();

    // Validate input
    if (!username || !email || !password) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if any users exist
    const [existingUsers]: any = await pool.query(
      "SELECT COUNT(*) as count FROM users"
    );

    // If users exist, disable signup
    if (existingUsers[0].count > 0) {
      return new NextResponse(
        "Signup is disabled. Please contact an administrator.",
        { status: 403 }
      );
    }

    // Check if email already exists
    const [existingUser]: any = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return new NextResponse("Email already exists", { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Generate UUID for user ID
    const userId = uuidv4();

    // Insert user into database
    await pool.query(
      `INSERT INTO users (id, username, email, password, role, is_admin, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [userId, username, email, hashedPassword, role]
    );

    return new NextResponse("User created successfully", { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
