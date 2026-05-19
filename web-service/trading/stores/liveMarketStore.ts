"use client";

import { create } from "zustand";
import { getMarketCandles } from "@/lib/api";
import { connectWS, type OrderBookLevel, type TradeTapeItem } from "@/trading/lib/websocket";
import type { Candle, CandleInterval } from "@/trading/types/trading.types";

type OrderBookState = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
};

export const EMPTY_ORDER_BOOK: OrderBookState = {
  bids: [],
  asks: [],
};

export const EMPTY_TRADES: TradeTapeItem[] = [];
export const EMPTY_CANDLES: Candle[] = [];

type LiveMarketState = {
  orderBooks: Record<string, OrderBookState>;
  trades: Record<string, TradeTapeItem[]>;
  candles: Record<string, Candle[]>;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  loadCandles: (symbol: string, interval: CandleInterval) => Promise<void>;
  getReferencePrice: (symbol: string) => number | null;
};

const sockets = new Map<string, WebSocket>();
const refs = new Map<string, number>();

const updateBookLevels = (levels: OrderBookLevel[], price: number, quantity: number) => {
  const next = new Map(levels);

  if (quantity === 0) {
    next.delete(price);
  } else {
    next.set(price, quantity);
  }

  return Array.from(next.entries());
};

const mergeCandles = (current: Candle[], incoming: Candle[]) => {
  const next = new Map(
    current.map((candle) => [`${candle.interval}:${candle.bucket}`, candle])
  );

  for (const candle of incoming) {
    next.set(`${candle.interval}:${candle.bucket}`, candle);
  }

  return Array.from(next.values()).sort((a, b) => a.bucket - b.bucket).slice(-2000);
};

export const useLiveMarketStore = create<LiveMarketState>((set, get) => ({
  orderBooks: {},
  trades: {},
  candles: {},
  loadCandles: async (symbol, interval) => {
    const { candles } = await getMarketCandles(symbol, interval, 500);

    set((state) => ({
      candles: {
        ...state.candles,
        [symbol]: mergeCandles(state.candles[symbol] || EMPTY_CANDLES, candles),
      },
    }));
  },
  subscribe: (symbol) => {
    refs.set(symbol, (refs.get(symbol) || 0) + 1);
    if (sockets.has(symbol)) return;

    const ws = connectWS(symbol, (message) => {
      if (message.type === "ORDERBOOK_SNAPSHOT") {
        set((state) => ({
          orderBooks: {
            ...state.orderBooks,
            [symbol]: {
              bids: message.data.bids || [],
              asks: message.data.asks || [],
            },
          },
        }));
      }

      if (message.type === "ORDERBOOK_DIFF") {
        const diff = message.data;
        set((state) => {
          const current = state.orderBooks[symbol] || EMPTY_ORDER_BOOK;
          return {
            orderBooks: {
              ...state.orderBooks,
              [symbol]: diff.side === "BUY"
                ? {
                    ...current,
                    bids: updateBookLevels(current.bids, diff.price, diff.quantity),
                  }
                : {
                    ...current,
                    asks: updateBookLevels(current.asks, diff.price, diff.quantity),
                  },
            },
          };
        });
      }

      if (message.type === "TRADE_SNAPSHOT") {
        set((state) => ({
          trades: {
            ...state.trades,
            [symbol]: message.data || [],
          },
        }));
      }

      if (message.type === "TRADE_UPDATE") {
        set((state) => ({
          trades: {
            ...state.trades,
            [symbol]: [message.data, ...(state.trades[symbol] || [])].slice(0, 50),
          },
        }));
      }

      if (message.type === "CANDLE_SNAPSHOT") {
        const nextCandles = message.data
          .filter((candle) => candle.symbol === symbol)
          .sort((a, b) => a.bucket - b.bucket)
          .slice(-500);
        set((state) => ({
          candles: {
            ...state.candles,
            [symbol]: mergeCandles(state.candles[symbol] || EMPTY_CANDLES, nextCandles),
          },
        }));
      }

      if (message.type === "CANDLE_UPDATE") {
        const nextCandle = message.data;
        if (nextCandle.symbol !== symbol) return;

        set((state) => {
          const current = state.candles[symbol] || EMPTY_CANDLES;
          const index = current.findIndex(
            (candle) =>
              candle.interval === nextCandle.interval &&
              candle.bucket === nextCandle.bucket
          );
          const nextCandles =
            index === -1
              ? [...current, nextCandle]
              : current.map((candle, candleIndex) =>
                  candleIndex === index ? nextCandle : candle
                );

          return {
            candles: {
              ...state.candles,
              [symbol]: nextCandles.sort((a, b) => a.bucket - b.bucket).slice(-2000),
            },
          };
        });
      }
    });

    sockets.set(symbol, ws);
  },
  unsubscribe: (symbol) => {
    const nextCount = Math.max((refs.get(symbol) || 1) - 1, 0);
    if (nextCount > 0) {
      refs.set(symbol, nextCount);
      return;
    }

    refs.delete(symbol);
    sockets.get(symbol)?.close();
    sockets.delete(symbol);
  },
  getReferencePrice: (symbol) => {
    const state = get();
    const trade = state.trades[symbol]?.[0];
    if (trade) return trade.price;

    const book = state.orderBooks[symbol];
    const bestAsk = book?.asks.slice().sort(([a], [b]) => a - b)[0]?.[0];
    const bestBid = book?.bids.slice().sort(([a], [b]) => b - a)[0]?.[0];

    if (bestAsk && bestBid) return (bestAsk + bestBid) / 2;
    return bestAsk || bestBid || null;
  },
}));
