import type { Trade } from "../matching/Trade.js";

export type TradeSnapshotItem = {
  id: number;
  symbol: string;
  price: number;
  quantity: number;
  side: "BUY" | "SELL";
  timestamp: number;
};

const MAX_TRADES_PER_SYMBOL = 50;
const tradesBySymbol = new Map<string, TradeSnapshotItem[]>();

export const addRecentTrade = (trade: Trade): TradeSnapshotItem => {
  const item: TradeSnapshotItem = {
    id: trade.id,
    symbol: trade.symbol,
    price: trade.price,
    quantity: trade.quantity,
    side: trade.side,
    timestamp: trade.timestamp,
  };

  const trades = tradesBySymbol.get(trade.symbol) || [];
  trades.unshift(item);
  tradesBySymbol.set(trade.symbol, trades.slice(0, MAX_TRADES_PER_SYMBOL));

  return item;
};

export const getRecentTrades = (symbol: string) => tradesBySymbol.get(symbol) || [];
