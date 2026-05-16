import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth/auth.utils.js";
import type { AuthenticatedRequest } from "../lib/http.js";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token" });
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const decoded = verifyToken(token);
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
