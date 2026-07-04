import { Order } from "../matching/Order.js";

const orders: Record<string, Order> = {};

export const addOrder = (order: Order) => {
  orders[order.id] = order;
};

export const updateOrder = (id: string, quantity: number) => {
  if (orders[id]) {
    orders[id].quantity = quantity;
  }
};

export const getOrder = (id: string) => orders[id];
