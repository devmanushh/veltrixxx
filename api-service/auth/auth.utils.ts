import jwt from "jsonwebtoken";
import { ENV } from "../../packages/config/env.js";

export const generateToken = (user: { id: string; email: string }) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, ENV.JWT_SECRET);
};
