"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketKind } from "@veltrix/config/markets";
import { EMPTY_CANDLES, useLiveMarketStore } from "@/stores/liveMarketStore";
import { useSelectedMarket } from "@/stores/marketStore";
import type { CandleInterval } from "@/types/trading.types";

type CandleChartProps = {
  marketKind: MarketKind;
};

const intervals: CandleInterval[] = ["1m", "5m", "15m", "1h"];

const formatValue = (value: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1000 ? 1 : 4,
  });

export default function CandleChart({ marketKind }: CandleChartProps) {
  const market = useSelectedMarket(marketKind);
  const subscribe = useLiveMarketStore((state) => state.subscribe);
  const unsubscribe = useLiveMarketStore((state) => state.unsubscribe);
  const candles = useLiveMarketStore((state) => state.candles[market.symbol]) || EMPTY_CANDLES;
  const [interval, setInterval] = useState<CandleInterval>("1m");

  useEffect(() => {
    subscribe(market.symbol);
    return () => unsubscribe(market.symbol);
  }, [market.symbol, subscribe, unsubscribe]);

  const visibleCandles = useMemo(
    () => candles.filter((candle) => candle.interval === interval).slice(-36),
    [candles, interval]
  );

  const latestCandle = visibleCandles[visibleCandles.length - 1];
  const minLow = Math.min(...visibleCandles.map((candle) => candle.low));
  const maxHigh = Math.max(...visibleCandles.map((candle) => candle.high));
  const range = Number.isFinite(maxHigh - minLow) && maxHigh > minLow ? maxHigh - minLow : 1;

  return (
    <section
      className="exchange-panel chart-panel"
    >
      <div className="panel-toolbar">
        <h2 className="panel-title">{market.selectorLabel} Chart</h2>
        <div className="interval-list">
          {intervals.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setInterval(item)}
              className={interval === item ? "interval-button interval-button-active" : "interval-button"}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-canvas">
        {visibleCandles.length === 0 && (
          <div className="empty-center">
            Waiting for candle updates from trades
          </div>
        )}

        {visibleCandles.map((candle) => {
          const isUp = candle.close >= candle.open;
          const color = isUp ? "var(--app-green)" : "var(--app-red)";
          const highOffset = ((maxHigh - candle.high) / range) * 100;
          const lowOffset = ((maxHigh - candle.low) / range) * 100;
          const openOffset = ((maxHigh - candle.open) / range) * 100;
          const closeOffset = ((maxHigh - candle.close) / range) * 100;
          const bodyTop = Math.min(openOffset, closeOffset);
          const bodyHeight = Math.max(Math.abs(openOffset - closeOffset), 2);

          return (
            <div
              key={`${candle.symbol}-${candle.interval}-${candle.bucket}`}
              title={`${new Date(candle.bucket).toLocaleTimeString()} O ${candle.open} H ${candle.high} L ${candle.low} C ${candle.close}`}
              className="candle-slot"
            >
              <span
                className="candle-wick"
                style={{
                  top: `${highOffset}%`,
                  height: `${Math.max(lowOffset - highOffset, 2)}%`,
                  background: color,
                }}
              />
              <span
                className="candle-body"
                style={{
                  top: `${bodyTop}%`,
                  height: `${bodyHeight}%`,
                  background: color,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="chart-stat-grid">
        {[
          ["Open", latestCandle ? formatValue(latestCandle.open) : "-"],
          ["High", latestCandle ? formatValue(latestCandle.high) : "-"],
          ["Low", latestCandle ? formatValue(latestCandle.low) : "-"],
          ["Close", latestCandle ? formatValue(latestCandle.close) : "-"],
          ["Volume", latestCandle ? formatValue(latestCandle.volume) : "-"],
        ].map(([label, value]) => (
          <div key={label} className="chart-stat">
            <span>{label}</span>
            <strong className="market-num stat-value">{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
