export type TradingSide = "buy" | "sell";

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

export type OrderRow = {
  id: string;
  symbol: string;
  price: number | null;
  quantity: number;
  side: string;
  type: string;
  status: string;
  createdAt: string;
};

export type TradeRow = {
  id: string;
  buyerId: string;
  sellerId: string;
  symbol: string;
  price: number;
  quantity: number;
  createdAt: string;
};
