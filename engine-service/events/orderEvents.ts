import { Order } from "../engine/Order.js";

export const ORDER_EVENT = "order";

export type OrderEventPayload = {
  order: Order;
};