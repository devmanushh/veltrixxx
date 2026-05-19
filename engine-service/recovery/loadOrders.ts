import { db } from "../../packages/db/client.js";
import { Order } from "../matching/Order.js";

type DbOrder = Awaited<ReturnType<typeof db.order.findMany>>[number];

const toEngineOrderId = (orderId: string) => {
  const parsed = Number.parseInt(orderId.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : Date.now();
};

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
        id: toEngineOrderId(o.id),
        dbId: o.id,
        userId: o.userId,
        symbol: o.symbol,
        price: o.price,
        quantity: o.remaining || o.quantity,
        side: o.side.toUpperCase() as "BUY" | "SELL",
        type: o.type.toUpperCase() as "LIMIT" | "MARKET" | "IOC" | "FOK" | "POST_ONLY",
        timestamp: o.createdAt.getTime()
      })
  );
};
