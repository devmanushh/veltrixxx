import { db } from "../index.js";

export const createUser = async (email: string, password: string) => {
  return db.user.create({
    data: {
      email,
      password,
    },
    select: {
      id: true,
      email: true,
      balance: true,
    },
  });
};

export const getUserByEmail = async (email: string) => {
  return db.user.findUnique({
    where: { email },
  });
};

export const getUserById = async (id: string) => {
  return db.user.findUnique({
    where: { id },
  });
};

export const updateBalance = async (id: string, balance: number) => {
  return db.user.update({
    where: { id },
    data: { balance },
  });
};
