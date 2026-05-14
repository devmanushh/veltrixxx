"use client";

import { getMarketsByKind, type MarketKind } from "@veltrix/config/markets";
import { useEffect } from "react";
import { EMPTY_ORDER_BOOK, EMPTY_TRADES, useLiveMarketStore } from "@/stores/liveMarketStore";
import { useSelectedMarket } from "@/stores/marketStore";

type MarketStatsBarProps = {
  marketKind: MarketKind;
  onMarketChange: (symbol: string) => void;
};

export default function MarketStatsBar({
  marketKind,
  onMarketChange,
}: MarketStatsBarProps) {
  const selectedMarket = useSelectedMarket(marketKind);
  const markets = getMarketsByKind(marketKind);
  const subscribe = useLiveMarketStore((state) => state.subscribe);
  const unsubscribe = useLiveMarketStore((state) => state.unsubscribe);
  const trades = useLiveMarketStore((state) => state.trades[selectedMarket.symbol]) || EMPTY_TRADES;
  const book = useLiveMarketStore((state) => state.orderBooks[selectedMarket.symbol]) || EMPTY_ORDER_BOOK;
  const latestTrade = trades[0];
  const bestAsk = book?.asks.slice().sort(([a], [b]) => a - b)[0]?.[0] || null;
  const bestBid = book?.bids.slice().sort(([a], [b]) => b - a)[0]?.[0] || null;
  const referencePrice = latestTrade?.price || (bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk || bestBid);
  const sessionPrices = trades.map((trade) => trade.price);
  const high = sessionPrices.length ? Math.max(...sessionPrices) : null;
  const low = sessionPrices.length ? Math.min(...sessionPrices) : null;
  const volume = trades.reduce((sum, trade) => sum + trade.price * trade.quantity, 0);
  const change = trades.length > 1 ? trades[0].price - trades[trades.length - 1].price : null;
  const changePercent = change && trades[trades.length - 1]?.price
    ? (change / trades[trades.length - 1].price) * 100
    : null;

  useEffect(() => {
    subscribe(selectedMarket.symbol);
    return () => unsubscribe(selectedMarket.symbol);
  }, [selectedMarket.symbol, subscribe, unsubscribe]);

  const formatPrice = (value: number | null | undefined) =>
    typeof value === "number"
      ? value.toLocaleString("en-US", {
          maximumFractionDigits: value >= 1000 ? 1 : 4,
        })
      : "-";

  return (
    <section className="exchange-panel market-bar">
      <div className="market-identity">
        <div aria-hidden="true" className="coin-badge">
          {selectedMarket.base.slice(0, 3)}
        </div>
        <div className="market-title-block">
          <div className="market-select-row">
            <strong className="text-strong">{selectedMarket.displaySymbol}</strong>
            <select
              value={selectedMarket.symbol}
              onChange={(event) => onMarketChange(event.target.value)}
              aria-label="Select market"
              className="market-select"
            >
              {markets.map((market) => (
                <option key={market.symbol} value={market.symbol}>
                  {market.selectorLabel}
                </option>
              ))}
            </select>
            {selectedMarket.leverage && (
              <span className="leverage-badge">
                {selectedMarket.leverage}
              </span>
            )}
          </div>
          <strong className="market-num market-price">{formatPrice(referencePrice)}</strong>
        </div>
      </div>

      <div className="market-stat">
        <span className="stat-label">Session Change</span>
        <strong className={`${(change || 0) >= 0 ? "market-green" : "market-red"} market-num stat-value`}>
          {change === null ? "-" : `${formatPrice(change)} ${changePercent === null ? "" : `${changePercent.toFixed(2)}%`}`}
        </strong>
      </div>
      <div className="market-stat">
        <span className="stat-label">Session High</span>
        <strong className="market-num stat-value">{formatPrice(high)}</strong>
      </div>
      <div className="market-stat">
        <span className="stat-label">Session Low</span>
        <strong className="market-num stat-value">{formatPrice(low)}</strong>
      </div>
      <div className="market-stat market-stat-wide">
        <span className="stat-label">Session Volume</span>
        <strong className="market-num stat-value">{formatPrice(volume || null)}</strong>
      </div>
    </section>
  );
}
