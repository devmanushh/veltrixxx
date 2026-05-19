import type { Trade } from "../matching/Trade.js";
import type { CandleInterval } from "./candle.types.js";
import { getCandle, setCandle } from "./candleStore.js";

const INTERVAL_MS: Record<CandleInterval, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
};

export const updateCandleFromTrade = (
  trade: Trade,
  interval: CandleInterval
) => {
  const bucket =
    Math.floor(trade.timestamp / INTERVAL_MS[interval]) *
    INTERVAL_MS[interval];

  let candle = getCandle(trade.symbol, interval, bucket);

  if (!candle) {
    candle = {
      symbol: trade.symbol,
      interval,
      bucket,
      open: trade.price,
      high: trade.price,
      low: trade.price,
      close: trade.price,
      volume: trade.quantity,
    };
  } else {
    candle.high = Math.max(candle.high, trade.price);
    candle.low = Math.min(candle.low, trade.price);
    candle.close = trade.price;
    candle.volume += trade.quantity;
  }

  setCandle(candle);

  return candle;
};
