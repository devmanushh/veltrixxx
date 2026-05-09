import bcrypt from "bcrypt";
import { createUser, getUserByEmail } from "../../packages/db/repositories/index.js";
import { AuthError, ValidationError } from "../../packages/index.js";
import { validateUser } from "../../packages/validators/index.js";
import { generateToken } from "./auth.utils.js";


//  REGISTER
export const registerUser = async (email: string, password: string) => {
  const validated = validateUser({ email, password });

  // 1. check existing user
  const existing = await getUserByEmail(validated.email);

  if (existing) {
    throw new ValidationError("User already exists");
  }

  // 2. hash password
  const hashed = await bcrypt.hash(validated.password, 10);

  // 3. store in DB
  const user = await createUser(validated.email, hashed);

  return {
    token: generateToken(user),
    user,
  };
};


// 🔑 LOGIN
export const loginUser = async (email: string, password: string) => {
  const validated = validateUser({ email, password });

  // 1. find user
  const user = await getUserByEmail(validated.email);

  if (!user) {
    throw new AuthError("Invalid credentials");
  }

  // 2. compare password
  const match = await bcrypt.compare(validated.password, user.password);

  if (!match) {
    throw new AuthError("Invalid credentials");
  }

  return {
    token: generateToken(user),
    user: {
      id: user.id,
      email: user.email,
      balance: user.balance,
    },
  };
};
