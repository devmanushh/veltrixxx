import "../config/env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";
import { ENV } from "../config/env.js";

const { PrismaClient } = pkg;

const getConnectionString = () => {
  if (!ENV.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const url = new URL(ENV.DATABASE_URL);

  if (url.searchParams.get("sslmode") === "require" && !url.searchParams.has("uselibpqcompat")) {
    url.searchParams.set("uselibpqcompat", "true");
  }

  return url.toString();
};

const adapter = new PrismaPg({
  connectionString: getConnectionString(),
});

const prisma = new PrismaClient({
  adapter,
});

export const db = prisma;
