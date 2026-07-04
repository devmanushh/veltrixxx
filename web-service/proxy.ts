import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { protectedRoutes, routes } from "@/routes";

const JWT_SECRET = process.env.JWT_SECRET || "";

const base64UrlToBytes = (value: string) => {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const decodeBase64UrlJson = (value: string) => {
  const json = new TextDecoder().decode(base64UrlToBytes(value));
  return JSON.parse(json) as Record<string, unknown>;
};

const verifyJwt = async (token: string) => {
  if (!JWT_SECRET) return false;

  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return false;
  }

  const header = decodeBase64UrlJson(encodedHeader);

  if (header.alg !== "HS256") {
    return false;
  }

  const payload = decodeBase64UrlJson(encodedPayload);
  const exp = typeof payload.exp === "number" ? payload.exp : 0;

  if (!exp || exp * 1000 <= Date.now()) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["verify"]
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value || "";
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const valid = await verifyJwt(token).catch(() => false);

  if (!valid) {
    const response = NextResponse.redirect(new URL(routes.login, request.url));
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
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