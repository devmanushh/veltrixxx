import { Redis } from "ioredis";
import { ENV } from "../../packages/config/env.js";

export const pub = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
});

pub.on("connect", () => {
  console.log("Connected to Redis");
});

pub.on("error", (err) => {
  console.error("Redis error:", err);
});

export const ensureRedisConnection = async () => {
  if (pub.status === "ready" || pub.status === "connect") {
    return;
  }

  if (pub.status === "connecting" || pub.status === "reconnecting") {
    await new Promise<void>((resolve, reject) => {
      pub.once("ready", resolve);
      pub.once("error", reject);
    });
    return;
  }

  try {
    await pub.connect();
  } catch {
    throw new Error("Redis unavailable. Start Redis with npm run dev:infra.");
  }
};

export const appendToStream = async <T>(stream: string, fields: Record<string, T>) => {
  await ensureRedisConnection();

  const args = Object.entries(fields).flatMap(([key, value]) => [
    key,
    typeof value === "string" ? value : JSON.stringify(value),
  ]);

  await pub.xadd(stream, "*", ...args);
};

export const publish = async () => {
  throw new Error("Redis pub/sub is disabled for critical delivery. Use appendToStream or the DB outbox.");
};