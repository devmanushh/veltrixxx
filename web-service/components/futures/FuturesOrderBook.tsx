"use client";

import { useEffect, useMemo } from "react";
import { EMPTY_ORDER_BOOK, useLiveMarketStore } from "@/stores/liveMarketStore";
import { useSelectedMarket } from "@/stores/marketStore";

const formatPrice = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: value > 1000 ? 1 : 2,
    maximumFractionDigits: value > 1000 ? 1 : 2,
  });

const formatSize = (value: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });

export default function FuturesOrderBook() {
  const market = useSelectedMarket("futures");
  const subscribe = useLiveMarketStore((state) => state.subscribe);
  const unsubscribe = useLiveMarketStore((state) => state.unsubscribe);
  const book = useLiveMarketStore((state) => state.orderBooks[market.symbol]) || EMPTY_ORDER_BOOK;
  const bids = book.bids;
  const asks = book.asks;

  useEffect(() => {
    subscribe(market.symbol);
    return () => unsubscribe(market.symbol);
  }, [market.symbol, subscribe, unsubscribe]);

  const levels = useMemo(() => {
    const topAsks = [...asks]
      .sort(([a], [b]) => a - b)
      .slice(0, 4)
      .reverse()
      .map(([price, size]) => ({ price, size, side: "ask" as const }));
    const topBids = [...bids]
      .sort(([a], [b]) => b - a)
      .slice(0, 4)
      .map(([price, size]) => ({ price, size, side: "bid" as const }));

    return [...topAsks, ...topBids];
  }, [asks, bids]);

  return (
    <div className="orderbook book-table">
      <div className="book-head">
        <span>Price</span>
        <span className="align-right">Contracts</span>
      </div>
      {levels.length === 0 && (
        <div className="book-row text-muted">
          <span>No open orders</span>
          <span className="align-right">-</span>
        </div>
      )}
      {levels.map(({ price, size, side }) => (
        <div
          key={`${market.symbol}-${side}-${price}`}
          className={side === "bid" ? "book-row market-green" : "book-row market-red"}
        >
          <span>{formatPrice(price)}</span>
          <span className="align-right text-strong">{formatSize(size)}</span>
        </div>
      ))}
    </div>
  );
}
