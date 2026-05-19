"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { MarketKind } from "@veltrix/config/markets";
import { EMPTY_CANDLES, useLiveMarketStore } from "@/trading/stores/liveMarketStore";
import { useSelectedMarket } from "@/trading/stores/marketStore";
import type { Candle, CandleInterval } from "@/trading/types/trading.types";

type CandleChartProps = {
  marketKind: MarketKind;
};

const intervals: CandleInterval[] = ["1m", "5m", "15m", "1h"];

const formatValue = (value: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1000 ? 2 : 4,
  });

const toChartTime = (bucket: number) => Math.floor(bucket / 1000) as UTCTimestamp;

export default function CandleChart({ marketKind }: CandleChartProps) {
  const market = useSelectedMarket(marketKind);
  const subscribe = useLiveMarketStore((state) => state.subscribe);
  const unsubscribe = useLiveMarketStore((state) => state.unsubscribe);
  const loadCandles = useLiveMarketStore((state) => state.loadCandles);
  const candles = useLiveMarketStore((state) => state.candles[market.symbol]) || EMPTY_CANDLES;
  const [interval, setInterval] = useState<CandleInterval>("1m");
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [loadError, setLoadError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const candleByTimeRef = useRef<Map<Time, Candle>>(new Map());

  useEffect(() => {
    subscribe(market.symbol);
    return () => unsubscribe(market.symbol);
  }, [market.symbol, subscribe, unsubscribe]);

  useEffect(() => {
    setLoadError("");
    void loadCandles(market.symbol, interval).catch((err: unknown) => {
      setLoadError(err instanceof Error ? err.message : "Unable to load candle history");
    });
  }, [interval, loadCandles, market.symbol]);

  const visibleCandles = useMemo(
    () =>
      candles
        .filter((candle) => candle.interval === interval)
        .sort((a, b) => a.bucket - b.bucket),
    [candles, interval]
  );

  const latestCandle = visibleCandles[visibleCandles.length - 1] || null;
  const activeCandle = hoveredCandle || latestCandle;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8d97a7",
      },
      grid: {
        vertLines: { color: "rgba(141, 151, 167, 0.12)" },
        horzLines: { color: "rgba(141, 151, 167, 0.12)" },
      },
      rightPriceScale: {
        borderColor: "rgba(141, 151, 167, 0.24)",
      },
      timeScale: {
        borderColor: "rgba(141, 151, 167, 0.24)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 8,
      },
      crosshair: {
        mode: 1,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#12b981",
      downColor: "#ef4444",
      wickUpColor: "#12b981",
      wickDownColor: "#ef4444",
      borderVisible: false,
      priceFormat: {
        type: "price",
        precision: 4,
        minMove: 0.0001,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setHoveredCandle(null);
        return;
      }

      setHoveredCandle(candleByTimeRef.current.get(param.time) || null);
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries) return;

    const candleData = visibleCandles.map((candle) => ({
      time: toChartTime(candle.bucket),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData = visibleCandles.map((candle) => ({
      time: toChartTime(candle.bucket),
      value: candle.volume,
      color: candle.close >= candle.open ? "rgba(18, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)",
    }));

    candleByTimeRef.current = new Map(
      visibleCandles.map((candle) => [toChartTime(candle.bucket), candle])
    );
    candleSeries.setData(candleData);
    volumeSeries.setData(volumeData);

    if (visibleCandles.length > 0) {
      chartRef.current?.timeScale().scrollToPosition(0, false);
    }
  }, [visibleCandles]);

  const zoom = (direction: "in" | "out") => {
    const timeScale = chartRef.current?.timeScale();
    const range = timeScale?.getVisibleLogicalRange();
    if (!timeScale || !range) return;

    const center = (range.from + range.to) / 2;
    const width = range.to - range.from;
    const nextWidth = direction === "in" ? width * 0.7 : width * 1.35;

    timeScale.setVisibleLogicalRange({
      from: center - nextWidth / 2,
      to: center + nextWidth / 2,
    });
  };

  const resetView = () => {
    chartRef.current?.timeScale().fitContent();
  };

  return (
    <section className="exchange-panel chart-panel">
      <div className="panel-toolbar">
        <h2 className="panel-title">{market.selectorLabel} Chart</h2>
        <div className="chart-toolbar">
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
          <div className="chart-tools">
            <button type="button" className="tool-button" title="Zoom in" onClick={() => zoom("in")}>
              +
            </button>
            <button type="button" className="tool-button" title="Zoom out" onClick={() => zoom("out")}>
              -
            </button>
            <button type="button" className="tool-button chart-reset-button" title="Fit chart" onClick={resetView}>
              Fit
            </button>
          </div>
        </div>
      </div>

      <div className="chart-canvas chart-canvas-live" ref={containerRef}>
        {visibleCandles.length === 0 && (
          <div className="empty-center">
            {loadError || "Waiting for candle history and live trades"}
          </div>
        )}
      </div>

      <div className="chart-stat-grid">
        {[
          ["Open", activeCandle ? formatValue(activeCandle.open) : "-"],
          ["High", activeCandle ? formatValue(activeCandle.high) : "-"],
          ["Low", activeCandle ? formatValue(activeCandle.low) : "-"],
          ["Close", activeCandle ? formatValue(activeCandle.close) : "-"],
          ["Volume", activeCandle ? formatValue(activeCandle.volume) : "-"],
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
