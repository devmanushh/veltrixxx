import "../config/env.js";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { ENV } from "../config/env.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const getConnectionString = () => {
  if (!ENV.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const url = new URL(ENV.DATABASE_URL);

  // Prisma Postgres compatibility
  if (
    url.searchParams.get("sslmode") === "require" &&
    !url.searchParams.has("pgbouncer")
  ) {
    url.searchParams.set("pgbouncer", "true");
  }

  return url.toString();
};

const adapter = new PrismaPg({
  connectionString: getConnectionString(),
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

export type DbTransactionClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
