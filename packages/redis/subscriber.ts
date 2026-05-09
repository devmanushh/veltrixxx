import { redis } from "./client.js";
import { CHANNELS } from "./channels.js";

export const subscribeOrders = (cb: (data: any) => void) => {
  const sub = redis.duplicate();

  sub.subscribe(CHANNELS.ORDERS);

  sub.on("message", (_channel: string, msg: string) => {
    cb(JSON.parse(msg));
  });
};

export const subscribeTrades = (cb: (data: any) => void) => {
  const sub = redis.duplicate();

  sub.subscribe(CHANNELS.TRADES);

  sub.on("message", (_channel: string, msg: string) => {
    cb(JSON.parse(msg));
  });
};
