import { addOrder } from "../stores/orderStore.js";
import { Order } from "../matching/Order.js";
import { marketManager } from "../market/MarketManager.js";

type IncomingOrder = {
  id?: string | number;
  userId: string;
  symbol: string;
  price?: number | null;
  quantity: number;
  side: string;
  type: string;
  timestamp?: number;
};

const toEngineOrder = (incoming: IncomingOrder) => {
  const dbId = String(incoming.id ?? Date.now());

  return new Order({
    id: dbId,
    dbId,
    userId: incoming.userId,
    symbol: incoming.symbol,
    price: incoming.price,
    quantity: incoming.quantity,
    side: incoming.side.toUpperCase() as "BUY" | "SELL",
    type: incoming.type.toUpperCase() as "LIMIT" | "MARKET" | "IOC" | "FOK" | "POST_ONLY",
    timestamp: incoming.timestamp ?? Date.now(),
  });
};

export const processOrder = (incoming: IncomingOrder) => {
  const order = toEngineOrder(incoming);
  addOrder(order);

  const result = marketManager.process(order);

  return result;
};
