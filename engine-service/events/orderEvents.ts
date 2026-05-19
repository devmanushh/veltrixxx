import { Order } from "../matching/Order.js";

export const ORDER_EVENT = "order";

export type OrderEventPayload = {
  order: Order;
};