import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_MAX_AGE_SECONDS, sessionCookieOptions } from "../cookies";

const API_URL = process.env.API_INTERNAL_URL || process.env.API_URL || "http://localhost:4000";
const DEFAULT_LOGIN_REDIRECT = "/spot/btcusdt";

const getSafeRedirect = (value: FormDataEntryValue | string | null, fallback = DEFAULT_LOGIN_REDIRECT) => {
  const next = typeof value === "string" ? value : "";

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
};

const readBody = async (request: Request) => {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      next: getSafeRedirect(form.get("next")),
      formRequest: true,
    };
  }

  const body = await request.json().catch(() => ({}));

  return {
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
    next: getSafeRedirect(typeof body.next === "string" ? body.next : new URL(request.url).searchParams.get("next")),
    formRequest: false,
  };
};

const errorResponse = (request: Request, message: string, status: number, next: string, formRequest: boolean) => {
  if (!formRequest) {
    return NextResponse.json({ error: message }, { status });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", next);
  loginUrl.searchParams.set("error", message);

  return NextResponse.redirect(loginUrl, { status: 303 });
};

export async function POST(request: Request) {
  const { email, password, next, formRequest } = await readBody(request);

  if (!email || !password) {
    return errorResponse(request, "Email and password are required", 400, next, formRequest);
  }

  const apiResponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  }).catch((err: unknown) => {
    throw new Error(err instanceof Error ? err.message : "API unavailable");
  });

  const text = await apiResponse.text();
  let data: Record<string, unknown> = {};

  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { error: text };
  }

  if (!apiResponse.ok) {
    const message = typeof data.error === "string" ? data.error : "Login failed";
    return errorResponse(request, message, apiResponse.status, next, formRequest);
  }

  const token = typeof data.token === "string" ? data.token : "";

  if (!token) {
    return errorResponse(request, "Login did not return a token", 502, next, formRequest);
  }

  const response = formRequest
    ? NextResponse.redirect(new URL(next, request.url), { status: 303 })
    : NextResponse.json({ ...data, redirectTo: next });

  response.cookies.set(COOKIE_NAME, token, {
    ...sessionCookieOptions(request),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}

