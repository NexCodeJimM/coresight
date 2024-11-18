import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { username, email, password, role } = await req.json();

    // Validate input
    if (!username || !email || !password || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Generate UUID for user ID
    const userId = uuidv4();

    // Insert user into database
    await pool.query(
      `INSERT INTO users (id, username, email, password, role, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, username, email, hashedPassword, role]
    );

    return new NextResponse("User created successfully", { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
