import { Router } from "express";
import { getMarketCandles, getMarketStats } from "./market.controller.js";

const router = Router();

router.get("/stats", getMarketStats);
router.get("/:symbol/candles", getMarketCandles);

export default router;
