import { Redis } from "ioredis";
import { ENV } from "../../packages/config/env.js";
import { Trade } from "../matching/Trade.js";

export const pub = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

pub.on("error", (err: Error) => {
  console.error("Publisher Redis error:", err.message);
});

const ensurePublisher = async () => {
  if (pub.status === "ready" || pub.status === "connect") {
    return true;
  }

  try {
    await pub.connect();
    return true;
  } catch {
    console.warn("Redis is unavailable; skipping trade publish.");
    return false;
  }
};

/**
 * Generic publish
 */
export const publish = async (channel: string, data: unknown) => {
  if (!(await ensurePublisher())) {
    return;
  }

  await pub.publish(channel, JSON.stringify(data));
};

export const publishTrades = async (trades: Trade[]) => {
  await publish("trades", trades);
};
