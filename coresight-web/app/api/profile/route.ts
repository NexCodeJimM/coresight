import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface UserRow extends RowDataPacket {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [rows] = await db.execute<UserRow[]>(
      'SELECT id, first_name, last_name, email, profile_picture FROM users WHERE id = ?',
      [session.user.id]
    );

    if (!rows.length) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Map profile_picture to image in the response to maintain frontend compatibility
    const userData = {
      ...rows[0],
      image: rows[0].profile_picture
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { first_name, last_name, email, image } = body;

    // Update user in MySQL database using profile_picture column
    await db.execute<ResultSetHeader>(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, profile_picture = ? WHERE id = ?',
      [first_name, last_name, email, image, session.user.id]
    );

    // Fetch the updated user data
    const [rows] = await db.execute<UserRow[]>(
      'SELECT id, first_name, last_name, email, profile_picture FROM users WHERE id = ?',
      [session.user.id]
    );

    if (!rows.length) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Map profile_picture to image in the response
    const updatedUser = {
      ...rows[0],
      image: rows[0].profile_picture
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PROFILE_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 