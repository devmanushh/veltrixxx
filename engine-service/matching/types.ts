// All core enums & shared types

export type OrderSide = "BUY" | "SELL";

export type OrderType =
  | "LIMIT"
  | "MARKET"
  | "IOC"
  | "FOK"
  | "POST_ONLY";

export type OrderStatus =
  | "OPEN"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCEL_PENDING"
  | "CANCELLED";

export type MarketSymbol = string; // e.g. "BTC-USDT"

// Integer-based system (IMPORTANT)
export type Price = number;    // scaled (1e6)
export type Quantity = number; // scaled (1e8)
export type Timestamp = number;