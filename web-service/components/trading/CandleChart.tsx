"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketConfig } from "@veltrix/config/markets";
import { connectWS } from "@/lib/websocket";

type CandleInterval = "1m" | "5m" | "15m" | "1h";

type Candle = {
  symbol: string;
  interval: CandleInterval;
  bucket: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type CandleChartProps = {
  market: MarketConfig;
};

const intervals: CandleInterval[] = ["1m", "5m", "15m", "1h"];

const formatValue = (value: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1000 ? 1 : 4,
  });

export default function CandleChart({ market }: CandleChartProps) {
  const [interval, setInterval] = useState<CandleInterval>("1m");
  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    setCandles([]);

    const ws = connectWS(market.symbol, (message) => {
      if (message.type === "CANDLE_SNAPSHOT") {
        const nextCandles = (message.data as Candle[]).filter(
          (candle) => candle.symbol === market.symbol
        );

        setCandles(nextCandles.sort((a, b) => a.bucket - b.bucket).slice(-80));
        return;
      }

      if (message.type !== "CANDLE_UPDATE") {
        return;
      }

      const nextCandle = message.data as Candle;

      if (nextCandle.symbol !== market.symbol) {
        return;
      }

      setCandles((currentCandles) => {
        const index = currentCandles.findIndex(
          (candle) =>
            candle.interval === nextCandle.interval &&
            candle.bucket === nextCandle.bucket
        );

        const nextCandles =
          index === -1
            ? [...currentCandles, nextCandle]
            : currentCandles.map((candle, candleIndex) =>
                candleIndex === index ? nextCandle : candle
              );

        return nextCandles
          .sort((a, b) => a.bucket - b.bucket)
          .slice(-80);
      });
    });

    return () => {
      ws.close();
    };
  }, [market.symbol]);

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
      style={{
        minHeight: 0,
        border: "1px solid var(--app-border, #20242d)",
        borderRadius: 8,
        background: "var(--app-panel, #11141c)",
        padding: 10,
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr) auto",
        gap: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{market.selectorLabel} Chart</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {intervals.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setInterval(item)}
              style={{
                height: 28,
                border: "1px solid var(--app-border, #20242d)",
                borderRadius: 6,
                background: interval === item ? "#2563eb" : "#0b0e11",
                color: interval === item ? "#ffffff" : "#a1a1aa",
                fontSize: 12,
                fontWeight: 800,
                padding: "0 9px",
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          minHeight: 0,
          display: "flex",
          alignItems: "stretch",
          gap: 5,
          padding: "10px 4px",
          borderTop: "1px solid var(--app-border, #20242d)",
          borderBottom: "1px solid var(--app-border, #20242d)",
        }}
      >
        {visibleCandles.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "grid",
              placeItems: "center",
              color: "#71717a",
              fontSize: 13,
            }}
          >
            Waiting for candle updates from trades
          </div>
        )}

        {visibleCandles.map((candle) => {
          const isUp = candle.close >= candle.open;
          const color = isUp ? "#22c55e" : "#ef4444";
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
              style={{
                position: "relative",
                flex: "1 1 0",
                minWidth: 5,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  top: `${highOffset}%`,
                  height: `${Math.max(lowOffset - highOffset, 2)}%`,
                  width: 1,
                  transform: "translateX(-50%)",
                  background: color,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "15%",
                  right: "15%",
                  top: `${bodyTop}%`,
                  height: `${bodyHeight}%`,
                  minHeight: 2,
                  borderRadius: 2,
                  background: color,
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, color: "#a1a1aa", fontSize: 12 }}>
        {[
          ["Open", latestCandle ? formatValue(latestCandle.open) : "-"],
          ["High", latestCandle ? formatValue(latestCandle.high) : "-"],
          ["Low", latestCandle ? formatValue(latestCandle.low) : "-"],
          ["Close", latestCandle ? formatValue(latestCandle.close) : "-"],
          ["Volume", latestCandle ? formatValue(latestCandle.volume) : "-"],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "grid", gap: 4 }}>
            <span>{label}</span>
            <strong style={{ color: "#f4f4f5", fontSize: 13 }}>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
