import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const response = await fetch(`${BACKEND_URL}/api/servers/${id}/health`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying health request:", error);
    return NextResponse.json(
      { error: "Failed to fetch server health" },
      { status: 500 }
    );
  }
}
