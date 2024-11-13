import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backendUrl = process.env.BACKEND_URL || "localhost:3000";

    // Fetch processes from your backend server
    const response = await fetch(
      `http://${backendUrl}/api/metrics/${params.id}/processes`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 10 }, // Cache for 10 seconds
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch processes");
    }

    const processes = await response.json();
    return NextResponse.json(processes);
  } catch (error) {
    console.error("Failed to fetch processes:", error);
    return NextResponse.json(
      { error: "Failed to fetch processes" },
      { status: 500 }
    );
  }
}
