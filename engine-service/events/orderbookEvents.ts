export const ORDERBOOK_DIFF_EVENT = "orderbook_diff";

export type OrderbookDiffPayload = {
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number; // 0 = remove level
};