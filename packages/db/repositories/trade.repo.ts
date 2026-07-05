import { db } from "../index.js";

export const createTrade = async (data: {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  buyerId: string;
  sellerId: string;
}) => {
  return db.trade.create({
    data: {
      ...data,
    },
  });
};

export const getTradesByUser = async (userId: string) => {
  return db.trade.findMany({
    where: {
      OR: [
        { buyerId: userId },
        { sellerId: userId },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getTradesBySymbol = async (symbol: string, limit?: number) => {
  return db.trade.findMany({
    where: { symbol },
    orderBy: {
      createdAt: "desc",
    },
    ...(limit ? { take: limit } : {}),
  });
};
