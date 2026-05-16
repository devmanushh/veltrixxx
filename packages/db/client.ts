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
  const sslMode = url.searchParams.get("sslmode");

  // Prisma Postgres compatibility
  if (sslMode === "require" && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }

  if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
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
