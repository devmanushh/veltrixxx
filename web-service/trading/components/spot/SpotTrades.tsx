"use client";

import { useEffect } from "react";
import { EMPTY_TRADES, useLiveMarketStore } from "@/trading/stores/liveMarketStore";
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

export default function SpotTrades() {
  const market = useSelectedMarket("spot");
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
        <span>Amount</span>
        <span>Side</span>
      </div>
      {trades.length === 0 && <span className="text-muted">No trades yet.</span>}
      {trades.map((trade) => (
        <div
          key={`${market.symbol}-trade-${trade.id}`}
          className="trades-row text-strong"
        >
          <span className={trade.side === "BUY" ? "market-green" : "market-red"}>
            {formatPrice(trade.price)}
          </span>
          <span>{formatSize(trade.quantity)}</span>
          <span>{trade.side === "BUY" ? "Buy" : "Sell"}</span>
        </div>
      ))}
    </div>
  );
}
