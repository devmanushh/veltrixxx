import { db } from "../index.js";

export const createOrder = async (data: {
  id: string;
  userId: string;
  symbol: string;
  price?: number | null;
  quantity: number;
  side: string;
  type: string;
}) => {
  return db.order.create({
    data: {
      id: data.id,
      userId: data.userId,
      symbol: data.symbol,
      price: data.price ?? null,
      quantity: data.quantity,
      side: data.side,
      type: data.type,
      status: "OPEN",
    },
  });
};

export const getOpenOrdersBySymbol = async (symbol: string) => {
  return db.order.findMany({
    where: {
      symbol,
      status: {
        in: ["OPEN", "PARTIALLY_FILLED", "CANCEL_PENDING"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const getOpenOrdersByUser = async (userId: string) => {
  return db.order.findMany({
    where: {
      userId,
      status: {
        in: ["OPEN", "PARTIALLY_FILLED", "CANCEL_PENDING"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateOrderStatus = async (
  id: string,
  status: "OPEN" | "FILLED" | "PARTIALLY_FILLED" | "CANCELLED"
) => {
  return db.order.update({
    where: { id },
    data: { status },
  });
};

export const getOrderById = async (id: string) => {
  return db.order.findUnique({
    where: { id },
  });
};
