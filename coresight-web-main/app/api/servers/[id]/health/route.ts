import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("BACKEND_URL environment variable is not set");
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(
      `Fetching health from: ${BACKEND_URL}/api/servers/${id}/health`
    );
    const response = await fetch(`${BACKEND_URL}/api/servers/${id}/health`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
