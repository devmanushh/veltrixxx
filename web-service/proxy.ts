import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { protectedRoutes, routes } from "@/routes";

const LOCAL_JWT_SECRET = process.env.VERCEL ? "" : "veltrix-secret";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || LOCAL_JWT_SECRET;
const isVercel = Boolean(process.env.VERCEL);
const DEFAULT_API_URL =
  isVercel ? "https://veltrixxx-api.onrender.com" : "http://localhost:4000";
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (isVercel ? process.env.API_INTERNAL_URL || process.env.API_URL : process.env.LOCAL_API_URL) ||
  DEFAULT_API_URL
).replace(/\/+$/, "");

const isSecureRequest = (request: NextRequest) => {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return request.nextUrl.protocol === "https:";
};
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

const verifyWithApi = async (token: string) => {
  if (!token || !API_URL) {
    return false;
  }

  const response = await fetch(`${API_URL}/wallet`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return response.ok;
};

const verifyAuthToken = async (token: string) => {
  if (!token) {
    return false;
  }

  const locallyValid = await verifyJwt(token).catch(() => false);

  if (locallyValid) {
    return true;
  }

  return verifyWithApi(token).catch(() => false);
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value || "";
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const valid = await verifyAuthToken(token);

  if (!valid) {
    const loginUrl = new URL(routes.login, request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: isSecureRequest(request),
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
