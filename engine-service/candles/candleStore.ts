import type { Candle, CandleInterval } from "./candle.types.js";

const candles = new Map<string, Candle>();

const key = (symbol: string, interval: CandleInterval, bucket: number) =>
  `${symbol}:${interval}:${bucket}`;

export const getCandle = (
  symbol: string,
  interval: CandleInterval,
  bucket: number
) => {
  return candles.get(key(symbol, interval, bucket));
};

export const setCandle = (candle: Candle) => {
  candles.set(key(candle.symbol, candle.interval, candle.bucket), candle);
};

export const getCandlesBySymbol = (symbol: string) => {
  return Array.from(candles.values())
    .filter((candle) => candle.symbol === symbol)
    .sort((a, b) => a.bucket - b.bucket);
};
