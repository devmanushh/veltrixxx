import type { Request, Response } from "express";
import { getOpenOrdersByUser, getTradesByUser } from "../../packages/db/repositories/index.js";
import { getAuthUser, sendError, type AuthenticatedRequest } from "../lib/http.js";

export const getOpenOrders = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req as AuthenticatedRequest, res);
    if (!user) return;

    const orders = await getOpenOrdersByUser(user.userId);

    return res.json({ orders });
  } catch (err) {
    return sendError(res, err, "Orders failed");
  }
};

export const getTradeHistory = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req as AuthenticatedRequest, res);
    if (!user) return;

    const trades = await getTradesByUser(user.userId);

    return res.json({ trades });
  } catch (err) {
    return sendError(res, err, "Trade history failed");
  }
};
