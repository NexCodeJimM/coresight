import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [result] = await db.query(
      `UPDATE alerts 
       SET status = 'resolved', resolved_at = NOW() 
       WHERE id = ? AND status = 'active'`,
      [params.id]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to resolve alert:", error);
    return NextResponse.json(
      { error: "Failed to resolve alert" },
      { status: 500 }
    );
  }
}
