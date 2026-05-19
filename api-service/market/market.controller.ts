import type { Request, Response } from "express";
import { MARKETS } from "../../packages/config/markets.js";
import { getCandles, getSessionStats, type CandleInterval } from "../../packages/db/index.js";

const intervals: CandleInterval[] = ["1m", "5m", "15m", "1h"];

const parseInterval = (value: unknown): CandleInterval =>
  intervals.includes(value as CandleInterval) ? (value as CandleInterval) : "1m";

const parseTimestamp = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 500;
  return Math.min(Math.max(Math.floor(parsed), 1), 1000);
};

const parseSymbols = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return MARKETS;
  }

  const requested = value
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  return requested.length > 0 ? requested : MARKETS;
};

export const getMarketCandles = async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol || "").toUpperCase();

  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" });
  }

  const candles = await getCandles({
    symbol,
    interval: parseInterval(req.query.interval),
    from: parseTimestamp(req.query.from),
    to: parseTimestamp(req.query.to),
    limit: parseLimit(req.query.limit),
  });

  return res.json({ candles });
};

export const getMarketStats = async (req: Request, res: Response) => {
  const symbols = parseSymbols(req.query.symbols);
  const stats = await Promise.all(symbols.map((symbol) => getSessionStats(symbol)));

  return res.json({
    stats: stats.filter(Boolean),
  });
};
