import { redis } from "./client.js";
import { ENGINE_EVENT_TYPES, ORDER_COMMAND_TYPES, STREAMS } from "./channels.js";
import type { Order, Trade } from "../types/index.js";

export const publishOrder = async (order: Order) => {
  await redis.xadd(
    STREAMS.ORDER_COMMANDS,
    "*",
    "type",
    ORDER_COMMAND_TYPES.PLACE,
    "payload",
    JSON.stringify(order)
  );
};

export const publishTrade = async (trade: Trade) => {
  await redis.xadd(
    STREAMS.TRADE_EVENTS,
    "*",
    "type",
    ENGINE_EVENT_TYPES.TRADE,
    "payload",
    JSON.stringify(trade)
  );
};