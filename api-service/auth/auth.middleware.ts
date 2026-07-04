import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./auth.utils.js";
import type { AuthenticatedRequest } from "../lib/http.js";

const readCookieToken = (cookieHeader: string | undefined) => {
  if (!cookieHeader) return "";

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const tokenCookie = cookies.find((part) => part.startsWith("token="));

  if (!tokenCookie) return "";

  return decodeURIComponent(tokenCookie.slice("token=".length));
};

const readBearerToken = (header: string | undefined) => {
  if (!header) return "";

  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : "";
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = readBearerToken(req.headers.authorization) || readCookieToken(req.headers.cookie);

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const decoded = verifyToken(token);
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};