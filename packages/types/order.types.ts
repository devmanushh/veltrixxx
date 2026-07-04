export type Order = {
  id: string;
  userId: string;
  symbol: string;
  price?: number | null;
  quantity: number;
  side: "buy" | "sell";
  type: "limit" | "market" | "IOC" | "FOK" | "POST_ONLY";
  status?: "OPEN" | "FILLED" | "PARTIALLY_FILLED" | "CANCEL_PENDING" | "CANCELLED";
  createdAt?: Date;
  timestamp?: number;
};
