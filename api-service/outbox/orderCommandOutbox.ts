import type { Prisma } from "@prisma/client";
import { ORDER_COMMAND_TYPES, STREAMS } from "../../packages/redis/channels.js";
import { db, type DbTransactionClient } from "../../packages/db/client.js";
import { ensureRedisConnection, pub } from "../lib/redis.js";

const DISPATCH_INTERVAL_MS = 1_000;
const BATCH_SIZE = 50;

type OrderCommandType = (typeof ORDER_COMMAND_TYPES)[keyof typeof ORDER_COMMAND_TYPES];

type JsonPayload = Prisma.InputJsonValue;

const toJsonPayload = (payload: unknown): JsonPayload => {
  return JSON.parse(JSON.stringify(payload)) as JsonPayload;
};

export const enqueueOrderCommand = async (
  tx: DbTransactionClient,
  eventType: OrderCommandType,
  payload: unknown
) => {
  await tx.outboxEvent.create({
    data: {
      topic: STREAMS.ORDER_COMMANDS,
      eventType,
      payload: toJsonPayload(payload),
    },
  });
};

export const dispatchOrderCommandOutboxBatch = async () => {
  const events = await db.outboxEvent.findMany({
    where: {
      topic: STREAMS.ORDER_COMMANDS,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
    take: BATCH_SIZE,
  });

  if (events.length === 0) return;

  await ensureRedisConnection();

  for (const event of events) {
    const claimed = await db.outboxEvent.updateMany({
      where: {
        id: event.id,
        status: "PENDING",
      },
      data: {
        status: "DISPATCHING",
        attempts: {
          increment: 1,
        },
        lastError: null,
      },
    });

    if (claimed.count !== 1) continue;

    try {
      await pub.xadd(
        event.topic,
        "*",
        "eventId",
        event.id,
        "type",
        event.eventType,
        "payload",
        JSON.stringify(event.payload)
      );

      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "SENT",
          dispatchedAt: new Date(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";

      await db.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "PENDING",
          lastError: message,
        },
      });

      throw err;
    }
  }
};

export const startOrderCommandOutboxDispatcher = () => {
  void db.outboxEvent.updateMany({
    where: {
      topic: STREAMS.ORDER_COMMANDS,
      status: "DISPATCHING",
    },
    data: {
      status: "PENDING",
    },
  });

  const dispatch = async () => {
    try {
      await dispatchOrderCommandOutboxBatch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      console.warn("Order command outbox dispatch failed:", message);
    }
  };

  void dispatch();

  const timer = setInterval(() => {
    void dispatch();
  }, DISPATCH_INTERVAL_MS);

  timer.unref?.();
};