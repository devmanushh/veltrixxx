export const COOKIE_NAME = "token";
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

const isLocalHttp = (url: URL) =>
  url.protocol === "http:" &&
  ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

export const isSecureRequest = (request: Request) => {
  const url = new URL(request.url);

  if (isLocalHttp(url)) {
    return false;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return url.protocol === "https:";
};

export const sessionCookieOptions = (request: Request) => ({
  httpOnly: true,
  secure: isSecureRequest(request),
  sameSite: "lax" as const,
  path: "/",
});

