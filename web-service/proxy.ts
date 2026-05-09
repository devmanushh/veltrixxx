import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/spot") ||
    pathname.startsWith("/future") ||
    pathname.startsWith("/portfolio") ||
    pathname.startsWith("/vault") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/position") ||
    pathname.startsWith("/balance");

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/spot/:path*",
    "/future/:path*",
    "/portfolio/:path*",
    "/vault/:path*",
    "/orders/:path*",
    "/history/:path*",
    "/position/:path*",
    "/balance/:path*",
  ],
};
