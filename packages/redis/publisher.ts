import { redis } from "./client.js";
import { CHANNELS } from "./channels.js";

export const publishOrder = (order: any) => {
  redis.publish(CHANNELS.ORDERS, JSON.stringify(order));
};

export const publishTrade = (trade: any) => {
  redis.publish(CHANNELS.TRADES, JSON.stringify(trade));
};