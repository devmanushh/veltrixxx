import { db } from "../../packages/db/client.js";
import { toNumber } from "../../packages/utils/decimal.js";
import { Order } from "../matching/Order.js";

type DbOrder = Awaited<ReturnType<typeof db.order.findMany>>[number];

export const loadOpenOrders = async (input: { olderThanMs?: number } = {}): Promise<Order[]> => {
  const where: {
    status: { in: string[] };
    createdAt?: { lte: Date };
  } = {
    status: {
      in: ["OPEN", "PARTIALLY_FILLED"],
    },
  };

  if (input.olderThanMs && input.olderThanMs > 0) {
    where.createdAt = {
      lte: new Date(Date.now() - input.olderThanMs),
    };
  }

  const orders = await db.order.findMany({
    where,
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