import jwt from "jsonwebtoken";
import { ENV } from "../../packages/config/env.js";
import type { AuthUser } from "../lib/http.js";

export const generateToken = (user: { id: string; email: string }) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export const verifyToken = (token: string): AuthUser => {
  const decoded = jwt.verify(token, ENV.JWT_SECRET);

  if (
    typeof decoded !== "object" ||
    typeof decoded.userId !== "string" ||
    typeof decoded.email !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
  };
};
