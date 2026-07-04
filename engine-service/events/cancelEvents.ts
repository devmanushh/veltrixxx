export const ORDER_CANCEL_EVENT = "order_cancel";

export type OrderCancelEventPayload = {
  orderId: string;
  symbol: string;
  userId?: string;
  removed: boolean;
  timestamp: number;
};