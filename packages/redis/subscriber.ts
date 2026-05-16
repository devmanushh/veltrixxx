import { redis } from "./client.js";
import { CHANNELS } from "./channels.js";
import type { Order, Trade } from "../types/index.js";

export const subscribeOrders = (cb: (data: Order) => void) => {
  const sub = redis.duplicate();

  sub.subscribe(CHANNELS.ORDERS);

  sub.on("message", (_channel: string, msg: string) => {
    cb(JSON.parse(msg) as Order);
  });
};

export const subscribeTrades = (cb: (data: Trade) => void) => {
  const sub = redis.duplicate();

  sub.subscribe(CHANNELS.TRADES);

  sub.on("message", (_channel: string, msg: string) => {
    cb(JSON.parse(msg) as Trade);
  });
};
