import type { Request, Response } from "express";
import { getOpenOrdersByUser, getTradesByUser } from "../../packages/db/repositories/index.js";
import { toNumber } from "../../packages/utils/decimal.js";
import { getAuthUser, sendError, type AuthenticatedRequest } from "../lib/http.js";

const serializeOrder = (order: Awaited<ReturnType<typeof getOpenOrdersByUser>>[number]) => ({
  ...order,
  price: order.price === null ? null : toNumber(order.price),
  quantity: toNumber(order.quantity),
  remaining: toNumber(order.remaining),
  lockedQuote: toNumber(order.lockedQuote),
  lockedBase: toNumber(order.lockedBase),
});

const serializeTrade = (trade: Awaited<ReturnType<typeof getTradesByUser>>[number]) => ({
  ...trade,
  price: toNumber(trade.price),
  quantity: toNumber(trade.quantity),
});

export const getOpenOrders = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req as AuthenticatedRequest, res);
    if (!user) return;

    const orders = await getOpenOrdersByUser(user.userId);

    return res.json({ orders: orders.map(serializeOrder) });
  } catch (err) {
    return sendError(res, err, "Orders failed");
  }
};

export const getTradeHistory = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req as AuthenticatedRequest, res);
    if (!user) return;

    const trades = await getTradesByUser(user.userId);

    return res.json({ trades: trades.map(serializeTrade) });
  } catch (err) {
    return sendError(res, err, "Trade history failed");
  }
};