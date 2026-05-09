import { ValidationError } from "../errors/index.js";
import type { User } from "../types/index.js";

export const validateUser = (user: Partial<User>) => {
  const email = user.email?.trim().toLowerCase();
  const password = user.password;

  if (!email) {
    throw new ValidationError("Email is required");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("Enter a valid email");
  }

  if (!password) {
    throw new ValidationError("Password is required");
  }

  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }

  return {
    email,
    password,
  };
};
