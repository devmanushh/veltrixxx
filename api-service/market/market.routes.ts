import { Router } from "express";
import { getMarketCandles, getMarketStats, getMarketTrades } from "./market.controller.js";

const router = Router();

router.get("/stats", getMarketStats);
router.get("/:symbol/trades", getMarketTrades);
router.get("/:symbol/candles", getMarketCandles);

export default router;
