export type CandleInterval = "1m" | "5m" | "15m" | "1h";

export type Candle = {
  symbol: string;
  interval: CandleInterval;
  bucket: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
