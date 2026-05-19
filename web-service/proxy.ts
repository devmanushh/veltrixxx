import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { protectedRoutes, routes } from "@/routes";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL(routes.login, request.url));
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
