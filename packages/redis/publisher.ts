import { redis } from "./client.js";
import { CHANNELS } from "./channels.js";
import type { Order, Trade } from "../types/index.js";

export const publishOrder = (order: Order) => {
  redis.publish(CHANNELS.ORDERS, JSON.stringify(order));
};

export const publishTrade = (trade: Trade) => {
  redis.publish(CHANNELS.TRADES, JSON.stringify(trade));
};
