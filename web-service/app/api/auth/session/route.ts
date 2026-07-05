import { NextResponse } from "next/server";

const COOKIE_NAME = "token";
const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

const isSecureRequest = (request: Request) => {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
};

const sessionCookieOptions = (request: Request) => ({
  httpOnly: true,
  secure: isSecureRequest(request),
  sameSite: "lax" as const,
  path: "/",
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    ...sessionCookieOptions(request),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const authenticated = cookieHeader
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`));

  return NextResponse.json({ authenticated });
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    ...sessionCookieOptions(request),
    maxAge: 0,
  });

  return response;
}
