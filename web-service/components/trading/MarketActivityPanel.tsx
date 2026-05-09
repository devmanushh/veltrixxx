"use client";

import { ReactNode, useState } from "react";

type MarketActivityPanelProps = {
  orderBook: ReactNode;
  trades: ReactNode;
};

export default function MarketActivityPanel({
  orderBook,
  trades,
}: MarketActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<"orderbook" | "trades">("orderbook");

  const tabStyle = (tab: "orderbook" | "trades") => ({
    flex: 1,
    height: 34,
    border: 0,
    borderRadius: 6,
    background: activeTab === tab ? "#2563eb" : "transparent",
    color: activeTab === tab ? "#ffffff" : "#a1a1aa",
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <section
      style={{
        minHeight: 0,
        display: "grid",
        gridTemplateRows: "44px minmax(0, 1fr)",
        border: "1px solid var(--app-border, #20242d)",
        borderRadius: 8,
        background: "var(--app-panel, #11141c)",
        overflow: "hidden",
      }}
    >
      <div
        role="tablist"
        aria-label="Market activity"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 5,
          borderBottom: "1px solid var(--app-border, #20242d)",
          background: "#0f1219",
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "orderbook"}
          onClick={() => setActiveTab("orderbook")}
          style={tabStyle("orderbook")}
        >
          Order Book
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "trades"}
          onClick={() => setActiveTab("trades")}
          style={tabStyle("trades")}
        >
          Trades
        </button>
      </div>

      <div style={{ minHeight: 0, overflow: "auto" }}>
        {activeTab === "orderbook" ? orderBook : trades}
      </div>
    </section>
  );
}
