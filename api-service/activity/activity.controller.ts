import type { Request, Response } from "express";
import { getOpenOrdersByUser, getTradesByUser } from "../../packages/db/repositories/index.js";

export const getOpenOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders = await getOpenOrdersByUser(user.userId);

    return res.json({ orders });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Orders failed" });
  }
};

export const getTradeHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const trades = await getTradesByUser(user.userId);

    return res.json({ trades });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Trade history failed" });
  }
};
