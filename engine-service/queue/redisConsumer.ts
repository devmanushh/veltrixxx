import { Redis } from "ioredis";
import { ENV } from "../../packages/config/env.js";
import { GROUPS, ORDER_COMMAND_TYPES, STREAMS } from "../../packages/redis/channels.js";
import { toNumber } from "../../packages/utils/decimal.js";
import { db } from "../../packages/db/client.js";
import { processOrder } from "./consumer.js";
import { marketManager } from "../market/MarketManager.js";
import { eventBus } from "../events/eventEmitter.js";
import { ORDER_CANCEL_EVENT } from "../events/cancelEvents.js";

const redis = new Redis(ENV.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

const CONSUMER_NAME = process.env.ENGINE_CONSUMER_NAME || "engine-main";
const PROCESSED_KEY_PREFIX = "veltrix:processed_order_command";

type StreamMessage = {
  id: string;
  fields: Record<string, string>;
};

type RawStreamResponse = [string, [string, string[]][]][];

type IncomingOrder = {
  id?: string | number;
  userId: string;
  symbol: string;
  price?: number | null;
  quantity: number;
  side: string;
  type: string;
  timestamp?: number;
};

redis.on("connect", () => {
  console.log("Connected to Redis order stream");
});

redis.on("error", (err: Error) => {
  console.error("Redis order stream error:", err.message);
});

const ensureGroup = async () => {
  try {
    await redis.xgroup("CREATE", STREAMS.ORDER_COMMANDS, GROUPS.ENGINE_ORDERS, "0", "MKSTREAM");
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
        GROUPS.ENGINE_ORDERS,
        CONSUMER_NAME,
        "COUNT",
        10,
        "BLOCK",
        blockMs,
        "STREAMS",
        STREAMS.ORDER_COMMANDS,
        id
      )
    : await redis.xreadgroup(
        "GROUP",
        GROUPS.ENGINE_ORDERS,
        CONSUMER_NAME,
        "COUNT",
        10,
        "STREAMS",
        STREAMS.ORDER_COMMANDS,
        id
      );

  return parseStreamResponse(response);
};

const alreadyProcessed = async (eventId: string) => {
  return (await redis.exists(`${PROCESSED_KEY_PREFIX}:${eventId}`)) === 1;
};

const markProcessed = async (eventId: string) => {
  await redis.set(`${PROCESSED_KEY_PREFIX}:${eventId}`, "1", "EX", 7 * 24 * 60 * 60);
};

const handlePlaceOrder = async (payload: IncomingOrder) => {
  const orderId = String(payload.id || "");

  if (!orderId) {
    throw new Error("Order command missing order id");
  }

  const persisted = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!persisted) {
    throw new Error(`Order ${orderId} is missing from persistence`);
  }

  if (!["OPEN", "PARTIALLY_FILLED"].includes(persisted.status)) {
    console.warn(`Skipping order ${orderId} with status ${persisted.status}`);
    return;
  }

  if (marketManager.hasOrder(persisted.symbol, orderId)) {
    return;
  }

  await processOrder({
    id: persisted.id,
    userId: persisted.userId,
    symbol: persisted.symbol,
    price: persisted.price === null ? null : toNumber(persisted.price),
    quantity: toNumber(persisted.remaining) || toNumber(persisted.quantity),
    side: persisted.side,
    type: persisted.type,
    timestamp: persisted.createdAt.getTime(),
  });
};

const handleCancelOrder = async (payload: { orderId?: string; symbol?: string; userId?: string }) => {
  const orderId = String(payload.orderId || "");
  const symbol = String(payload.symbol || "");

  if (!orderId || !symbol) {
    throw new Error("Cancel command missing order id or symbol");
  }

  const removed = marketManager.cancel(symbol, orderId);

  if (!removed) {
    console.warn(`Cancel missed orderbook order ${orderId} for ${symbol}`);
  }

  await eventBus.emit(ORDER_CANCEL_EVENT, {
    orderId,
    symbol,
    userId: payload.userId,
    removed,
    timestamp: Date.now(),
  });
};

const handleCommand = async (message: StreamMessage) => {
  const eventId = message.fields.eventId || message.id;

  if (await alreadyProcessed(eventId)) {
    await redis.xack(STREAMS.ORDER_COMMANDS, GROUPS.ENGINE_ORDERS, message.id);
    return;
  }

  const type = message.fields.type;
  const payload = JSON.parse(message.fields.payload || "{}");

  if (type === ORDER_COMMAND_TYPES.PLACE) {
    await handlePlaceOrder(payload as IncomingOrder);
  } else if (type === ORDER_COMMAND_TYPES.CANCEL) {
    await handleCancelOrder(payload as { orderId?: string; symbol?: string; userId?: string });
  } else {
    throw new Error(`Unknown order command type: ${String(type)}`);
  }

  await markProcessed(eventId);
  await redis.xack(STREAMS.ORDER_COMMANDS, GROUPS.ENGINE_ORDERS, message.id);
};

const processMessages = async (messages: StreamMessage[]) => {
  let failures = 0;

  for (const message of messages) {
    try {
      await handleCommand(message);
    } catch (err) {
      failures++;
      const errorMessage = err instanceof Error ? err.message : "unknown error";
      console.error(`Order command ${message.id} failed:`, errorMessage);
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

export const startConsumer = async () => {
  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    await ensureGroup();
    await drainPending();

    void consumeLoop();
    console.log(`Consuming ${STREAMS.ORDER_COMMANDS} as ${GROUPS.ENGINE_ORDERS}/${CONSUMER_NAME}`);
  } catch {
    console.warn("Redis is unavailable; order stream consumer is paused. Run npm run dev:infra to start Redis.");
  }
};