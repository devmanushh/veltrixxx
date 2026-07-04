import bcrypt from "bcrypt";
import { createUser, getUserByEmail } from "../../packages/db/repositories/index.js";
import { AuthError, ValidationError } from "../../packages/index.js";
import { validateUser } from "../../packages/validators/index.js";
import { toNumber, type NumericLike } from "../../packages/utils/decimal.js";
import { generateToken } from "./auth.utils.js";

const publicUser = (user: { id: string; email: string; balance: NumericLike }) => ({
  id: user.id,
  email: user.email,
  balance: toNumber(user.balance),
});

// REGISTER
export const registerUser = async (email: string, password: string) => {
  const validated = validateUser({ email, password });

  const existing = await getUserByEmail(validated.email);

  if (existing) {
    throw new ValidationError("User already exists");
  }

  const hashed = await bcrypt.hash(validated.password, 10);
  const user = await createUser(validated.email, hashed);

  return {
    token: generateToken(user),
    user: publicUser(user),
  };
};

// LOGIN
export const loginUser = async (email: string, password: string) => {
  const validated = validateUser({ email, password });

  const user = await getUserByEmail(validated.email);

  if (!user) {
    throw new AuthError("Invalid credentials");
  }

  const match = await bcrypt.compare(validated.password, user.password);

  if (!match) {
    throw new AuthError("Invalid credentials");
  }

  return {
    token: generateToken(user),
    user: publicUser(user),
  };
};