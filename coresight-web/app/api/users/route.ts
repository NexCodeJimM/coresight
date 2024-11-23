import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

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
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch timestamps in UTC
    const [rows] = await pool.query<UserRow[]>(`
      SELECT 
        id, 
        username,
        first_name,
        last_name, 
        email, 
        role,
        is_admin,
        profile_picture,
        CONVERT_TZ(last_login, @@session.time_zone, '+00:00') as last_login
      FROM users
      ORDER BY created_at DESC
    `);

    // Get timezone info separately
    const [[timeZoneInfo]] = await pool.query<RowDataPacket[]>(`
      SELECT 
        @@global.time_zone as global_tz,
        @@session.time_zone as session_tz
    `);

    console.log("Database Timezone Settings:", timeZoneInfo);

    return NextResponse.json({
      success: true,
      users: rows,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const { username, first_name, last_name, email, password, role } =
      await req.json();

    // Validate input
    if (
      !username ||
      !email ||
      !password ||
      !role ||
      !first_name ||
      !last_name
    ) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Generate UUID for user ID
    const userId = uuidv4();

    // Set is_admin based on role
    const is_admin = role === "admin" ? 1 : 0;

    // Insert user into database
    await pool.query(
      `INSERT INTO users (
        id, 
        username, 
        first_name,
        last_name,
        email, 
        password, 
        role,
        is_admin, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        username,
        first_name,
        last_name,
        email,
        hashedPassword,
        role,
        is_admin,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create user",
      },
      { status: 500 }
    );
  }
}
