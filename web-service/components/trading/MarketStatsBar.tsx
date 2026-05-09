"use client";

import type { MarketConfig } from "@veltrix/config/markets";

type MarketStatsBarProps = {
  markets: MarketConfig[];
  selectedMarket: MarketConfig;
  onMarketChange: (symbol: string) => void;
};

const statStyle = {
  display: "grid",
  gap: 4,
  minWidth: 110,
};

const coinColors: Record<string, string> = {
  BTC: "#f59e0b",
  ETH: "#8b5cf6",
  SOL: "#14f195",
  XRP: "#94a3b8",
  DOGE: "#d6a84f",
  ADA: "#3b82f6",
  AVAX: "#ef4444",
  LINK: "#2563eb",
  SUI: "#38bdf8",
  BNB: "#f3ba2f",
};

export default function MarketStatsBar({
  markets,
  selectedMarket,
  onMarketChange,
}: MarketStatsBarProps) {
  const coinColor = coinColors[selectedMarket.base] || "#f59e0b";

  return (
    <section
      style={{
        height: 76,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 16px",
        border: "1px solid var(--app-border, #20242d)",
        borderRadius: 8,
        background: "var(--app-panel, #11141c)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 330 }}>
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            border: `1px solid ${coinColor}`,
            background: selectedMarket.base === "BTC" ? "#f7931a" : "rgba(255,255,255,0.04)",
            color: selectedMarket.base === "BTC" ? "#111827" : coinColor,
            fontWeight: 900,
            fontSize: selectedMarket.base === "BTC" ? 12 : 13,
          }}
        >
          {selectedMarket.base === "BTC" ? "BTC" : selectedMarket.base.slice(0, 3)}
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <strong style={{ fontSize: 16 }}>{selectedMarket.displaySymbol}</strong>
            <select
              value={selectedMarket.symbol}
              onChange={(event) => onMarketChange(event.target.value)}
              aria-label="Select market"
              style={{
                height: 30,
                border: "1px solid var(--app-border, #20242d)",
                borderRadius: 6,
                background: "#0b0e11",
                color: "#f4f4f5",
                padding: "0 8px",
              }}
            >
              {markets.map((market) => (
                <option key={market.symbol} value={market.symbol}>
                  {market.selectorLabel}
                </option>
              ))}
            </select>
            {selectedMarket.leverage && (
              <span
                style={{
                  padding: "2px 7px",
                  borderRadius: 5,
                  background: "#1f2937",
                  color: "#cbd5e1",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {selectedMarket.leverage}
              </span>
            )}
          </div>
          <strong style={{ color: "#f4f4f5", fontSize: 22 }}>{selectedMarket.price}</strong>
        </div>
      </div>

      <div style={statStyle}>
        <span style={{ color: "#71717a", fontSize: 12 }}>24H Change</span>
        <strong style={{ color: "#22c55e", fontSize: 13 }}>
          {selectedMarket.stats.change} {selectedMarket.stats.changePercent}
        </strong>
      </div>
      <div style={statStyle}>
        <span style={{ color: "#71717a", fontSize: 12 }}>24H High</span>
        <strong style={{ color: "#d4d4d8", fontSize: 13 }}>{selectedMarket.stats.high}</strong>
      </div>
      <div style={statStyle}>
        <span style={{ color: "#71717a", fontSize: 12 }}>24H Low</span>
        <strong style={{ color: "#d4d4d8", fontSize: 13 }}>{selectedMarket.stats.low}</strong>
      </div>
      <div style={{ ...statStyle, minWidth: 150 }}>
        <span style={{ color: "#71717a", fontSize: 12 }}>24H Volume (USD)</span>
        <strong style={{ color: "#d4d4d8", fontSize: 13 }}>{selectedMarket.stats.volumeUsd}</strong>
      </div>
    </section>
  );
}
