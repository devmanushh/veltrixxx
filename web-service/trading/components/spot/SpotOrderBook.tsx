"use client";

import { useEffect, useMemo } from "react";
import { EMPTY_ORDER_BOOK, useLiveMarketStore } from "@/trading/stores/liveMarketStore";
import { useSelectedMarket } from "@/trading/stores/marketStore";

const formatPrice = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: value > 1000 ? 1 : 2,
    maximumFractionDigits: value > 1000 ? 1 : 2,
  });

const formatSize = (value: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });

export default function SpotOrderBook() {
  const market = useSelectedMarket("spot");
  const subscribe = useLiveMarketStore((state) => state.subscribe);
  const unsubscribe = useLiveMarketStore((state) => state.unsubscribe);
  const book = useLiveMarketStore((state) => state.orderBooks[market.symbol]) || EMPTY_ORDER_BOOK;
  const bids = book.bids;
  const asks = book.asks;

  useEffect(() => {
    subscribe(market.symbol);
    return () => unsubscribe(market.symbol);
  }, [market.symbol, subscribe, unsubscribe]);

  const sortedAsks = useMemo(
    () => [...asks].sort(([a], [b]) => a - b).slice(0, 8).reverse(),
    [asks]
  );
  const sortedBids = useMemo(
    () => [...bids].sort(([a], [b]) => b - a).slice(0, 8),
    [bids]
  );
  const bestPrice = sortedAsks[0]?.[0] || sortedBids[0]?.[0] || null;

  return (
    <div className="orderbook book-table">
      <div className="book-head">
        <span>Price</span>
        <span className="align-right">Size</span>
      </div>
      {sortedAsks.length === 0 && (
        <div className="book-row text-muted">
          <span>No asks</span>
          <span className="align-right">-</span>
        </div>
      )}
      {sortedAsks.map(([price, size]) => (
        <div key={`${market.symbol}-ask-${price}`} className="book-row market-red">
          <span>{formatPrice(price)}</span>
          <span className="align-right text-strong">{formatSize(size)}</span>
        </div>
      ))}
      <strong className="market-price">{bestPrice ? formatPrice(bestPrice) : "No live book"}</strong>
      {sortedBids.length === 0 && (
        <div className="book-row text-muted">
          <span>No bids</span>
          <span className="align-right">-</span>
        </div>
      )}
      {sortedBids.map(([price, size]) => (
        <div key={`${market.symbol}-bid-${price}`} className="book-row market-green">
          <span>{formatPrice(price)}</span>
          <span className="align-right text-strong">{formatSize(size)}</span>
        </div>
      ))}
    </div>
  );
}
