import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const BACKEND_URL = "http://165.22.237.60:3000"; // Use your backend URL

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = `${BACKEND_URL}/api/servers/${params.id}/metrics/history`;
    console.log("Requesting metrics history from:", url);

    const response = await fetch(url, {
      headers: {
        "Cache-Control": "no-cache",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url,
      });
      throw new Error(
        `Backend responded with ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data.data || []);
  } catch (error) {
    console.error("Failed to fetch metrics history:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch metrics history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
