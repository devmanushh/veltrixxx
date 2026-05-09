import { Redis } from "ioredis";
import { db, type DbTransactionClient } from "../../packages/db/client.js";
import { ENV } from "../../packages/config/env.js";

const sub = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

const TRADE_CHANNEL = "trades";

sub.on("error", (err: Error) => {
  console.error("Trade worker Redis error:", err.message);
});

export const startTradeWorker = async () => {
  try {
    if (sub.status !== "ready") {
      await sub.connect();
    }

    await sub.subscribe(TRADE_CHANNEL);
  } catch {
    console.warn("Redis is unavailable; trade persistence worker is paused.");
  }
};

sub.on("message", async (_: string, message: string) => {
  try {
    const trade = JSON.parse(message);
    const buyOrderStatus = trade.buyOrderRemaining > 0 ? "PARTIALLY_FILLED" : "FILLED";
    const sellOrderStatus = trade.sellOrderRemaining > 0 ? "PARTIALLY_FILLED" : "FILLED";

    await db.$transaction(async (tx: DbTransactionClient) => {
      await tx.trade.create({
        data: {
          id: trade.id.toString(),
          buyerId: trade.buyerId,
          sellerId: trade.sellerId,
          symbol: trade.symbol,
          price: trade.price,
          quantity: trade.quantity,
          createdAt: new Date(trade.timestamp),
        },
      });

      await tx.order.updateMany({
        where: {
          id: trade.buyOrderDbId,
          status: {
            not: "CANCELLED",
          },
        },
        data: {
          status: buyOrderStatus,
        },
      });

      await tx.order.updateMany({
        where: {
          id: trade.sellOrderDbId,
          status: {
            not: "CANCELLED",
          },
        },
        data: {
          status: sellOrderStatus,
        },
      });
    });

    console.log("Trade saved:", trade.id);
  } catch (err) {
    console.error("Trade persist error:", err);
  }
});
