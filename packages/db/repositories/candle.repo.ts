import { db } from "../index.js";
import { toNumber } from "../../utils/decimal.js";

export type CandleInterval = "1m" | "5m" | "15m" | "1h";

export type CandleInput = {
  symbol: string;
  interval: CandleInterval;
  bucket: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export const upsertCandle = async (candle: CandleInput) => {
  const bucket = new Date(candle.bucket);

  return db.candle.upsert({
    where: {
      symbol_interval_bucket: {
        symbol: candle.symbol,
        interval: candle.interval,
        bucket,
      },
    },
    create: {
      ...candle,
      bucket,
    },
    update: {
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    },
  });
};

export const getCandles = async ({
  symbol,
  interval,
  from,
  to,
  limit = 500,
}: {
  symbol: string;
  interval: CandleInterval;
  from?: number;
  to?: number;
  limit?: number;
}) => {
  const where = {
    symbol,
    interval,
    ...(from || to
      ? {
          bucket: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const candles = await db.candle.findMany({
    where,
    orderBy: {
      bucket: "desc",
    },
    take: limit,
  });

  return candles.reverse().map((candle) => ({
    symbol: candle.symbol,
    interval: candle.interval as CandleInterval,
    bucket: candle.bucket.getTime(),
    open: toNumber(candle.open),
    high: toNumber(candle.high),
    low: toNumber(candle.low),
    close: toNumber(candle.close),
    volume: toNumber(candle.volume),
  }));
};

export const getSessionStats = async (symbol: string, interval: CandleInterval = "1m") => {
  const from = Date.now() - 24 * 60 * 60 * 1000;
  const candles = await getCandles({
    symbol,
    interval,
    from,
    limit: 1440,
  });

  if (candles.length === 0) {
    return null;
  }

  const open = candles[0].open;
  const close = candles[candles.length - 1].close;
  const high = Math.max(...candles.map((candle) => candle.high));
  const low = Math.min(...candles.map((candle) => candle.low));
  const volume = candles.reduce((sum, candle) => sum + candle.volume, 0);
  const volumeUsd = candles.reduce((sum, candle) => sum + candle.volume * candle.close, 0);
  const change = close - open;
  const changePercent = open ? (change / open) * 100 : 0;

  return {
    symbol,
    open,
    high,
    low,
    close,
    volume,
    volumeUsd,
    change,
    changePercent,
  };
};