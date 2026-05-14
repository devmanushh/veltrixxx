"use client";

import { useState } from "react";
import type { MarketKind } from "@veltrix/config/markets";
import SpotOrderBook from "@/components/spot/SpotOrderBook";
import SpotTrades from "@/components/spot/SpotTrades";
import FuturesOrderBook from "@/components/futures/FuturesOrderBook";
import FuturesTrades from "@/components/futures/FuturesTrades";

type MarketActivityPanelProps = {
  marketKind: MarketKind;
};

export default function MarketActivityPanel({
  marketKind,
}: MarketActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<"orderbook" | "trades">("orderbook");
  const orderBook = marketKind === "spot" ? <SpotOrderBook /> : <FuturesOrderBook />;
  const trades = marketKind === "spot" ? <SpotTrades /> : <FuturesTrades />;

  return (
    <section
      className="exchange-panel activity-panel"
    >
      <div
        role="tablist"
        aria-label="Market activity"
        className="activity-tabs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "orderbook"}
          onClick={() => setActiveTab("orderbook")}
          className={activeTab === "orderbook" ? "tab-button tab-button-active" : "tab-button"}
        >
          Order Book
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "trades"}
          onClick={() => setActiveTab("trades")}
          className={activeTab === "trades" ? "tab-button tab-button-active" : "tab-button"}
        >
          Trades
        </button>
      </div>

      <div className="activity-body">
        {activeTab === "orderbook" ? orderBook : trades}
      </div>
    </section>
  );
}
