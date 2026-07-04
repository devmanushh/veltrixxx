import { Redis } from "ioredis";
import { ENV } from "../../packages/config/env.js";
import { ENGINE_EVENT_TYPES, STREAMS } from "../../packages/redis/channels.js";
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
    return;
  }

  await pub.connect();
};

export const appendStreamEvent = async (stream: string, eventType: string, data: unknown) => {
  await ensurePublisher();
  await pub.xadd(stream, "*", "type", eventType, "payload", JSON.stringify(data));
};

export const publishTradeEvent = async (trade: Trade) => {
  await appendStreamEvent(STREAMS.TRADE_EVENTS, ENGINE_EVENT_TYPES.TRADE, trade);
};

export const publishTrades = async (trades: Trade[]) => {
  await Promise.all(trades.map((trade) => publishTradeEvent(trade)));
};

export const publish = async (channel: string, data: unknown) => {
  if (channel === "trades") {
    await appendStreamEvent(STREAMS.TRADE_EVENTS, ENGINE_EVENT_TYPES.TRADE, data);
    return;
  }

  throw new Error(`Unsupported volatile publish channel: ${channel}`);
};