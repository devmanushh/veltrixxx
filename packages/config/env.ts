import fs from "node:fs";
import path from "node:path";

const loadEnvFile = () => {
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ];

  const envPath = envPaths.find((filePath) => fs.existsSync(filePath));

  if (!envPath) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadEnvFile();

const valueOrDefault = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const urlOrDefault = (value: string | undefined, fallback: string) => {
  const firstValue = valueOrDefault(value, fallback).split(",")[0]?.trim();
  return (firstValue || fallback).replace(/\/+$/, "");
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",

  DATABASE_URL: valueOrDefault(process.env.DATABASE_URL, ""),
  REDIS_URL: valueOrDefault(process.env.REDIS_URL, "redis://localhost:6379"),
  JWT_SECRET: valueOrDefault(process.env.JWT_SECRET, "veltrix-secret"),
  CORS_ORIGIN: valueOrDefault(process.env.CORS_ORIGIN, "http://localhost:3000"),

  API_PORT: Number(process.env.API_PORT ?? process.env.PORT ?? 4000),

  APP_URL: urlOrDefault(process.env.APP_URL, "http://localhost:3000"),
  STRIPE_SECRET_KEY: valueOrDefault(process.env.STRIPE_SECRET_KEY, ""),
  STRIPE_PUBLISHABLE_KEY: valueOrDefault(process.env.STRIPE_PUBLISHABLE_KEY, ""),
  STRIPE_WEBHOOK_SECRET: valueOrDefault(process.env.STRIPE_WEBHOOK_SECRET, ""),
};
