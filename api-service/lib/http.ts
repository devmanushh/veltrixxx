import type { Request, Response } from "express";

export type AuthUser = {
  userId: string;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export const getAuthUser = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return req.user;
};

export const sendError = (
  res: Response,
  err: unknown,
  fallbackMessage: string,
  fallbackStatus = 500
) => {
  const candidate = err as { statusCode?: number; message?: string };

  return res.status(candidate.statusCode || fallbackStatus).json({
    error: candidate.message || fallbackMessage,
  });
};
