import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { getOpenOrders, getTradeHistory } from "./activity.controller.js";

const router = Router();

router.get("/orders/open", authMiddleware, getOpenOrders);
router.get("/trades/history", authMiddleware, getTradeHistory);

export default router;
