import { db } from "../../packages/db/client.js";
import { toNumber } from "../../packages/utils/decimal.js";
import { Order } from "../matching/Order.js";

type DbOrder = Awaited<ReturnType<typeof db.order.findMany>>[number];

export const loadOpenOrders = async (): Promise<Order[]> => {
  const orders = await db.order.findMany({
    where: {
      status: {
        in: ["OPEN", "PARTIALLY_FILLED"],
      },
    }
  });

  return orders.map(
    (o: DbOrder) =>
      new Order({
        id: o.id,
        dbId: o.id,
        userId: o.userId,
        symbol: o.symbol,
        price: o.price === null ? null : toNumber(o.price),
        quantity: toNumber(o.remaining) || toNumber(o.quantity),
        side: o.side.toUpperCase() as "BUY" | "SELL",
        type: o.type.toUpperCase() as "LIMIT" | "MARKET" | "IOC" | "FOK" | "POST_ONLY",
        timestamp: o.createdAt.getTime()
      })
  );
};