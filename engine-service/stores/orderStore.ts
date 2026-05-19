import { Order } from "../matching/Order.js";

const orders: Record<number, Order> = {};

export const addOrder = (order: Order) => {
  orders[order.id] = order;
};

export const updateOrder = (id: number, quantity: number) => {
  if (orders[id]) {
    orders[id].quantity = quantity;
  }
};

export const getOrder = (id: number) => orders[id];
