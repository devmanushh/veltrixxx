import type { Order } from "../types/index.js";
import { ValidationError } from "../errors/index.js";

export const validateOrder = (order: Partial<Order>) => {
  if (!order.symbol) {
    throw new ValidationError("Symbol is required");
  }

  if (!order.quantity || order.quantity <= 0) {
    throw new ValidationError("Quantity must be > 0");
  }

  if (!order.side || !["buy", "sell"].includes(order.side)) {
    throw new ValidationError("Invalid order side");
  }

  if (!order.type || !["limit", "market"].includes(order.type)) {
    throw new ValidationError("Invalid order type");
  }

  if (order.type === "limit" && (!order.price || order.price <= 0)) {
    throw new ValidationError("Price must be > 0 for limit orders");
  }
};
