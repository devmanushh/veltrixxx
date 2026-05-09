import { AppError } from "./AppError.js";

class AuthError extends AppError {
  constructor(message: string) {
    super(message, 401);
    this.name = "AuthError";
  }
}

export { AuthError };
