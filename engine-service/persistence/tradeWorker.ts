import { Redis } from "ioredis";
import { db, type DbTransactionClient } from "../../packages/db/client.js";
import { ENV } from "../../packages/config/env.js";
import { parseMarketAssets } from "../../packages/utils/parseMarketAssets.js";

const sub = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

const TRADE_CHANNEL = "trades";
let tradePersistQueue = Promise.resolve();

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

const persistTrade = async (message: string) => {
  try {
    const trade = JSON.parse(message);
    const buyOrderStatus = trade.buyOrderRemaining > 0 ? "PARTIALLY_FILLED" : "FILLED";
    const sellOrderStatus = trade.sellOrderRemaining > 0 ? "PARTIALLY_FILLED" : "FILLED";
    const { base } = parseMarketAssets(trade.symbol);
    const cost = Number(trade.price) * Number(trade.quantity);

    await db.$transaction(async (tx: DbTransactionClient) => {
      const existingTrade = await tx.trade.findUnique({
        where: { id: trade.id.toString() },
      });

      if (existingTrade) return;

      const [buyOrder, sellOrder] = await Promise.all([
        tx.order.findUnique({ where: { id: trade.buyOrderDbId } }),
        tx.order.findUnique({ where: { id: trade.sellOrderDbId } }),
      ]);

      if (!buyOrder || !sellOrder) {
        throw new Error("Matched order is missing from persistence");
      }

      const nextBuyLockedQuote = Math.max(Number(buyOrder.lockedQuote || 0) - cost, 0);
      const buyRefund = trade.buyOrderRemaining > 0 ? 0 : nextBuyLockedQuote;
      const nextSellLockedBase = Math.max(Number(sellOrder.lockedBase || 0) - Number(trade.quantity), 0);

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

      await tx.order.update({
        where: { id: trade.buyOrderDbId },
        data: {
          status: buyOrderStatus,
          remaining: trade.buyOrderRemaining,
          lockedQuote: trade.buyOrderRemaining > 0 ? nextBuyLockedQuote : 0,
        },
      });

      await tx.order.update({
        where: { id: trade.sellOrderDbId },
        data: {
          status: sellOrderStatus,
          remaining: trade.sellOrderRemaining,
          lockedBase: nextSellLockedBase,
        },
      });

      if (buyRefund > 0) {
        await tx.user.update({
          where: { id: trade.buyerId },
          data: {
            balance: {
              increment: buyRefund,
            },
          },
        });
      }

      await tx.assetBalance.upsert({
        where: {
          userId_asset: {
            userId: trade.buyerId,
            asset: base,
          },
        },
        create: {
          userId: trade.buyerId,
          asset: base,
          free: trade.quantity,
          locked: 0,
        },
        update: {
          free: {
            increment: trade.quantity,
          },
        },
      });

      await tx.assetBalance.updateMany({
        where: {
          userId: trade.sellerId,
          asset: base,
        },
        data: {
          locked: {
            decrement: trade.quantity,
          },
        },
      });

      await tx.user.update({
        where: { id: trade.sellerId },
        data: {
          balance: {
            increment: cost,
          },
        },
      });
    });

    console.log("Trade saved:", trade.id);
  } catch (err) {
    console.error("Trade persist error:", err);
  }
};

sub.on("message", (_: string, message: string) => {
  tradePersistQueue = tradePersistQueue.then(() => persistTrade(message));
});
