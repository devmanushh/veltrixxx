"use client";

import { useEffect } from "react";
import { EMPTY_TRADES, useLiveMarketStore } from "@/trading/stores/liveMarketStore";
import { useSelectedMarket } from "@/trading/stores/marketStore";
import type { TradeTapeItem } from "@/trading/lib/websocket";

const formatPrice = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: value > 1000 ? 1 : 2,
    maximumFractionDigits: value > 1000 ? 1 : 2,
  });

const formatSize = (value: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });

const sideLabel = (side: TradeTapeItem["side"]) => {
  if (side === "BUY") return "Long";
  if (side === "SELL") return "Short";
  return "Match";
};

const sideClass = (side: TradeTapeItem["side"]) => {
  if (side === "BUY") return "market-green";
  if (side === "SELL") return "market-red";
  return "text-muted";
};

export default function FuturesTrades() {
  const market = useSelectedMarket("futures");
  const subscribe = useLiveMarketStore((state) => state.subscribe);
  const unsubscribe = useLiveMarketStore((state) => state.unsubscribe);
  const trades = useLiveMarketStore((state) => state.trades[market.symbol]) || EMPTY_TRADES;

  useEffect(() => {
    subscribe(market.symbol);
    return () => unsubscribe(market.symbol);
  }, [market.symbol, subscribe, unsubscribe]);

  return (
    <div className="orderbook trades-table">
      <div className="trades-head">
        <span>Price</span>
        <span>Size</span>
        <span>Side</span>
      </div>
      {trades.length === 0 && <span className="text-muted">No trades yet.</span>}
      {trades.map((trade) => (
        <div
          key={`${market.symbol}-trade-${trade.id}`}
          className="trades-row text-strong"
        >
          <span className={sideClass(trade.side)}>
            {formatPrice(trade.price)}
          </span>
          <span>{formatSize(trade.quantity)}</span>
          <span>{sideLabel(trade.side)}</span>
        </div>
      ))}
    </div>
  );
}
