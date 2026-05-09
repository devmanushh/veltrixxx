export type Symbol = "BTCUSDT" | "ETHUSDT" | "SOLUSDT";

export type OrderBookLevel = {
  price: number;
  quantity: number;
};

export type OrderBook = {
  symbol: Symbol;
  bids: OrderBookLevel[]; // buy orders
  asks: OrderBookLevel[]; // sell orders
};