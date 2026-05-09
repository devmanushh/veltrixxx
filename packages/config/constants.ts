export const ORDER_STATUS = {
  OPEN: "OPEN",
  FILLED: "FILLED",
  PARTIALLY_FILLED: "PARTIALLY_FILLED",
  CANCELLED: "CANCELLED",
} as const;

export const ORDER_TYPE = {
  LIMIT: "limit",
  MARKET: "market",
} as const;

export const ORDER_SIDE = {
  BUY: "buy",
  SELL: "sell",
} as const;