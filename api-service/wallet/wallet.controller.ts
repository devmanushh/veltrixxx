import type { Request, Response } from "express";
import { db } from "../../packages/db/client.js";

export const getWallet = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const wallet = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        balance: true,
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    return res.json({ wallet });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Wallet failed" });
  }
};
