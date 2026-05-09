import { Redis } from "ioredis";
import { ENV } from "../../packages/config/env.js";
import { processOrder } from "./consumer.js";
import { marketManager } from "../market/MarketManager.js";

const sub = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

sub.on("connect", () => {
  console.log("Connected to Redis");
});

const toEngineOrderId = (orderId: string | number) => {
  if (typeof orderId === "number") return orderId;

  const parsed = Number.parseInt(String(orderId).replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : NaN;
};

sub.on("error", (err: Error) => {
  console.error("Redis error:", err.message);
});

export const startConsumer = async () => {
  try {
    if (sub.status !== "ready") {
      await sub.connect();
    }

    const count = await sub.subscribe("orders", "cancel_orders");
    console.log(`Subscribed to ${String(count)} channels`);
  } catch {
    console.warn("Redis is unavailable; order queue consumer is paused. Run npm run dev:infra to start Redis.");
  }
};

sub.on("message", (channel: string, message: string) => {
  try {
    const data = JSON.parse(message);

    if (channel === "orders") {
      console.log("Received order:", data);
      processOrder(data);
      return;
    }

    if (channel === "cancel_orders") {
      const { orderId, symbol } = data;

      if (!orderId || !symbol) {
        console.warn("Invalid cancel payload");
        return;
      }

      const removed = marketManager.cancel(symbol, toEngineOrderId(orderId));

      if (!removed) {
        console.warn(`Cancel missed orderbook order ${String(orderId)} for ${String(symbol)}`);
      }
    }
  } catch (err) {
    console.error("Message processing error:", err);
  }
});
