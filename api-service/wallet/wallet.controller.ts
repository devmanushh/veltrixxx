import type { Request, Response } from "express";
import { db } from "../../packages/db/client.js";
import { getAuthUser, sendError, type AuthenticatedRequest } from "../lib/http.js";

export const getWallet = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req as AuthenticatedRequest, res);
    if (!user) return;

    const wallet = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        balance: true,
        assetBalances: {
          select: {
            asset: true,
            free: true,
            locked: true,
          },
          orderBy: {
            asset: "asc",
          },
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    return res.json({ wallet });
  } catch (err) {
    return sendError(res, err, "Wallet failed");
  }
};
