import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get hostname of request (e.g. localhost:3000, example.com, etc.)
  const { pathname } = request.nextUrl;

  // If it's an API request, rewrite to the backend URL
  if (pathname.startsWith("/api/")) {
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      // Remove /api from the pathname when forwarding to backend
      const apiPath = pathname.replace(/^\/api/, "");
      const url = new URL(apiPath, backendUrl);
      url.search = request.nextUrl.search;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
