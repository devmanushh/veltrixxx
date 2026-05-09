import { ensureRedisConnection, pub } from "../lib/redis.js";
// import type { Order } from "@veltrix/types";
import type { Order } from "../../packages/types/index.js";


export const sendOrderToEngine = async (order: Order) => {
  await ensureRedisConnection();
  await pub.publish("orders", JSON.stringify(order));
};
