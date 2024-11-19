import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const response = await fetch(
      `http://143.198.84.214:3000/api/servers/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in server details API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch server details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
