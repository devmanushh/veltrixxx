import { Redis } from "ioredis";
import { db, type DbTransactionClient } from "../../packages/db/client.js";
import { ENV } from "../../packages/config/env.js";
import { ENGINE_EVENT_TYPES, GROUPS, STREAMS } from "../../packages/redis/channels.js";
import { parseMarketAssets } from "../../packages/utils/parseMarketAssets.js";
import { toDecimalString, toNumber } from "../../packages/utils/decimal.js";
import { eventBus } from "../events/eventEmitter.js";
import { TRADE_EVENT, type TradeEventPayload } from "../events/tradeEvents.js";
import { enqueueSettlement } from "./settlementQueue.js";

const redis = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

const CONSUMER_NAME = process.env.TRADE_PERSISTENCE_CONSUMER_NAME || "trade-persistence-main";

type StreamMessage = {
  id: string;
  fields: Record<string, string>;
};

type RawStreamResponse = [string, [string, string[]][]][];

redis.on("error", (err: Error) => {
  console.error("Trade worker Redis error:", err.message);
});

const ensureGroup = async () => {
  try {
    await redis.xgroup("CREATE", STREAMS.TRADE_EVENTS, GROUPS.TRADE_PERSISTENCE, "0", "MKSTREAM");
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!message.includes("BUSYGROUP")) throw err;
  }
};

const fieldsToRecord = (fields: string[]) => {
  const record: Record<string, string> = {};

  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i];
    const value = fields[i + 1];
    if (key && value !== undefined) {
      record[key] = value;
    }
  }

  return record;
};

const parseStreamResponse = (response: unknown): StreamMessage[] => {
  if (!response) return [];

  const streams = response as RawStreamResponse;
  return streams.flatMap(([, messages]) =>
    messages.map(([id, fields]) => ({
      id,
      fields: fieldsToRecord(fields),
    }))
  );
};

const readMessages = async (id: ">" | "0", blockMs?: number) => {
  const response = blockMs
    ? await redis.xreadgroup(
        "GROUP",
        GROUPS.TRADE_PERSISTENCE,
        CONSUMER_NAME,
        "COUNT",
        10,
        "BLOCK",
        blockMs,
        "STREAMS",
        STREAMS.TRADE_EVENTS,
        id
      )
    : await redis.xreadgroup(
        "GROUP",
        GROUPS.TRADE_PERSISTENCE,
        CONSUMER_NAME,
        "COUNT",
        10,
        "STREAMS",
        STREAMS.TRADE_EVENTS,
        id
      );

  return parseStreamResponse(response);
};

const persistTrade = async (tradeInput: string | TradeEventPayload["trade"]) => {
  const trade = typeof tradeInput === "string" ? JSON.parse(tradeInput) : tradeInput;
  const tradeId = trade.id.toString();
  const tradePrice = toDecimalString(trade.price);
  const tradeQuantity = toDecimalString(trade.quantity);
  const tradeQuantityNumber = toNumber(tradeQuantity);
  const buyOrderRemaining = toDecimalString(trade.buyOrderRemaining);
  const sellOrderRemaining = toDecimalString(trade.sellOrderRemaining);
  const buyOrderStatus = toNumber(buyOrderRemaining) > 0 ? "PARTIALLY_FILLED" : "FILLED";
  const sellOrderStatus = toNumber(sellOrderRemaining) > 0 ? "PARTIALLY_FILLED" : "FILLED";
  const { base } = parseMarketAssets(trade.symbol);
  const cost = toDecimalString(toNumber(tradePrice) * tradeQuantityNumber);
  const costNumber = toNumber(cost);

  const saved = await db.$transaction(async (tx: DbTransactionClient) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('veltrix_trade'), hashtext(${tradeId}))`;

    const existingTrade = await tx.trade.findUnique({
      where: { id: tradeId },
    });

    if (existingTrade) return false;

    const [buyOrder, sellOrder] = await Promise.all([
      tx.order.findUnique({ where: { id: trade.buyOrderDbId } }),
      tx.order.findUnique({ where: { id: trade.sellOrderDbId } }),
    ]);

    if (!buyOrder || !sellOrder) {
      throw new Error("Matched order is missing from persistence");
    }

    if (buyOrder.status === "CANCELLED" || sellOrder.status === "CANCELLED") {
      throw new Error("Matched order was cancelled before settlement");
    }

    const nextBuyLockedQuote = toDecimalString(Math.max(toNumber(buyOrder.lockedQuote) - costNumber, 0));
    const buyRefund = toNumber(buyOrderRemaining) > 0 ? "0" : nextBuyLockedQuote;
    const nextSellLockedBase = toDecimalString(Math.max(toNumber(sellOrder.lockedBase) - tradeQuantityNumber, 0));

    const buyOrderUpdate = await tx.order.updateMany({
      where: {
        id: trade.buyOrderDbId,
        status: {
          not: "CANCELLED",
        },
      },
      data: {
        status: buyOrderStatus,
        remaining: buyOrderRemaining,
        lockedQuote: toNumber(buyOrderRemaining) > 0 ? nextBuyLockedQuote : "0",
      },
    });

    const sellOrderUpdate = await tx.order.updateMany({
      where: {
        id: trade.sellOrderDbId,
        status: {
          not: "CANCELLED",
        },
      },
      data: {
        status: sellOrderStatus,
        remaining: sellOrderRemaining,
        lockedBase: nextSellLockedBase,
      },
    });

    if (buyOrderUpdate.count !== 1 || sellOrderUpdate.count !== 1) {
      throw new Error("Matched order changed before settlement");
    }

    await tx.trade.create({
      data: {
        id: tradeId,
        buyerId: trade.buyerId,
        sellerId: trade.sellerId,
        symbol: trade.symbol,
        price: tradePrice,
        quantity: tradeQuantity,
        createdAt: new Date(trade.timestamp),
      },
    });

    if (toNumber(buyRefund) > 0) {
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
        free: tradeQuantity,
        locked: 0,
      },
      update: {
        free: {
          increment: tradeQuantity,
        },
      },
    });

    const sellerDebit = await tx.assetBalance.updateMany({
      where: {
        userId: trade.sellerId,
        asset: base,
        locked: {
          gte: tradeQuantity,
        },
      },
      data: {
        locked: {
          decrement: tradeQuantity,
        },
      },
    });

    if (sellerDebit.count !== 1) {
      throw new Error("Seller locked balance was insufficient for settlement");
    }

    await tx.user.update({
      where: { id: trade.sellerId },
      data: {
        balance: {
          increment: cost,
        },
      },
    });

    return true;
  });

  if (saved) {
    console.log("Trade saved:", trade.id);
  }
};

const persistStreamMessage = async (message: StreamMessage) => {
  if (message.fields.type !== ENGINE_EVENT_TYPES.TRADE) {
    await redis.xack(STREAMS.TRADE_EVENTS, GROUPS.TRADE_PERSISTENCE, message.id);
    return;
  }

  await enqueueSettlement(() => persistTrade(message.fields.payload || "{}"));
  await redis.xack(STREAMS.TRADE_EVENTS, GROUPS.TRADE_PERSISTENCE, message.id);
};

const processMessages = async (messages: StreamMessage[]) => {
  let failures = 0;

  for (const message of messages) {
    try {
      await persistStreamMessage(message);
    } catch (err) {
      failures++;
      const errorMessage = err instanceof Error ? err.message : "unknown error";
      console.error(`Trade stream message ${message.id} failed:`, errorMessage);
    }
  }

  return failures;
};

const drainPending = async () => {
  while (true) {
    const messages = await readMessages("0");
    if (messages.length === 0) return;

    const failures = await processMessages(messages);
    if (failures > 0) return;
  }
};

const consumeLoop = async () => {
  while (true) {
    const messages = await readMessages(">", 5_000);
    await processMessages(messages);
  }
};

export const startTradeWorker = async () => {
  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    await ensureGroup();
    await drainPending();

    void consumeLoop();
    console.log(`Consuming ${STREAMS.TRADE_EVENTS} as ${GROUPS.TRADE_PERSISTENCE}/${CONSUMER_NAME}`);
  } catch {
    console.warn("Redis is unavailable; trade persistence stream worker is paused.");
  }
};
eventBus.on<TradeEventPayload>(TRADE_EVENT, ({ trade }) =>
  enqueueSettlement(() => persistTrade(trade)).catch((err) => {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("Trade persist error:", message);
  })
);
