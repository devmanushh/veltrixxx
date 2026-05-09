import { OrderBook } from "../engine/OrderBook.js";

const markets: Record<string, OrderBook> = {};

export const getOrderBook = (symbol: string) => {
  if (!markets[symbol]) {
    markets[symbol] = new OrderBook(symbol);
  }

  return markets[symbol];
};
