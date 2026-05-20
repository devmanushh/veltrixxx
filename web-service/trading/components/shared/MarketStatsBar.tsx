"use client";

import { getMarketsByKind, type MarketKind } from "@veltrix/config/markets";
import { useEffect, useMemo, useState } from "react";
import { getMarketStats } from "@/lib/api";
import { EMPTY_CANDLES, EMPTY_ORDER_BOOK, EMPTY_TRADES, useLiveMarketStore } from "@/trading/stores/liveMarketStore";
import { useSelectedMarket } from "@/trading/stores/marketStore";
import type { MarketSessionStats } from "@/trading/types/trading.types";

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
  const loadCandles = useLiveMarketStore((state) => state.loadCandles);
  const trades = useLiveMarketStore((state) => state.trades[selectedMarket.symbol]) || EMPTY_TRADES;
  const book = useLiveMarketStore((state) => state.orderBooks[selectedMarket.symbol]) || EMPTY_ORDER_BOOK;
  const candles = useLiveMarketStore((state) => state.candles[selectedMarket.symbol]) || EMPTY_CANDLES;
  const [apiStats, setApiStats] = useState<MarketSessionStats | null>(null);
  const latestTrade = trades[0];
  const bestAsk = book?.asks.slice().sort(([a], [b]) => a - b)[0]?.[0] || null;
  const bestBid = book?.bids.slice().sort(([a], [b]) => b - a)[0]?.[0] || null;
  const sessionStats = useMemo(() => {
    const latestBucket = Math.max(0, ...candles.map((candle) => candle.bucket));
    const cutoff = latestBucket - 24 * 60 * 60 * 1000;
    const sessionCandles = candles
      .filter((candle) => candle.interval === "1m" && candle.bucket >= cutoff)
      .sort((a, b) => a.bucket - b.bucket);

    if (sessionCandles.length === 0) {
      return apiStats;
    }

    const open = sessionCandles[0].open;
    const close = sessionCandles[sessionCandles.length - 1].close;
    const high = Math.max(...sessionCandles.map((candle) => candle.high));
    const low = Math.min(...sessionCandles.map((candle) => candle.low));
    const volume = sessionCandles.reduce((sum, candle) => sum + candle.volume, 0);
    const volumeUsd = sessionCandles.reduce((sum, candle) => sum + candle.volume * candle.close, 0);
    const change = close - open;

    return {
      symbol: selectedMarket.symbol,
      open,
      high,
      low,
      close,
      volume,
      volumeUsd,
      change,
      changePercent: open ? (change / open) * 100 : 0,
    };
  }, [apiStats, candles, selectedMarket.symbol]);
  const referencePrice =
    latestTrade?.price ||
    sessionStats?.close ||
    (bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk || bestBid);

  useEffect(() => {
    subscribe(selectedMarket.symbol);
    void loadCandles(selectedMarket.symbol, "1m");
    void getMarketStats([selectedMarket.symbol]).then(({ stats }) => {
      setApiStats(stats.find((item) => item.symbol === selectedMarket.symbol) || null);
    });
    return () => unsubscribe(selectedMarket.symbol);
  }, [loadCandles, selectedMarket.symbol, subscribe, unsubscribe]);

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
          </div>
          <strong className="market-num market-price">{formatPrice(referencePrice)}</strong>
        </div>
      </div>

      <div className="market-stat">
        <span className="stat-label">
          <span className="stat-label-full">Session Change</span>
          <span className="stat-label-short">Chng</span>
        </span>
        <strong className={`${(sessionStats?.change || 0) >= 0 ? "market-green" : "market-red"} market-num stat-value`}>
          {sessionStats ? `${formatPrice(sessionStats.change)} ${sessionStats.changePercent.toFixed(2)}%` : "-"}
        </strong>
      </div>
      <div className="market-stat">
        <span className="stat-label">
          <span className="stat-label-full">Session High</span>
          <span className="stat-label-short">High</span>
        </span>
        <strong className="market-num stat-value">{formatPrice(sessionStats?.high)}</strong>
      </div>
      <div className="market-stat">
        <span className="stat-label">
          <span className="stat-label-full">Session Low</span>
          <span className="stat-label-short">Low</span>
        </span>
        <strong className="market-num stat-value">{formatPrice(sessionStats?.low)}</strong>
      </div>
      <div className="market-stat market-stat-wide">
        <span className="stat-label">
          <span className="stat-label-full">Session Volume</span>
          <span className="stat-label-short">Vol</span>
        </span>
        <strong className="market-num stat-value">{formatPrice(sessionStats?.volumeUsd)}</strong>
      </div>
    </section>
  );
}
