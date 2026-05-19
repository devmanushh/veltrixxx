"use client";

import { SPOT_MARKETS } from "@veltrix/config/markets";
import { useEffect, useMemo, useState } from "react";
import { getMarketStats } from "@/lib/api";
import type { MarketSessionStats } from "@/trading/types/trading.types";

const formatPrice = (value: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1000 ? 1 : 4,
  });

const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

export default function ExchangeTicker() {
  const [stats, setStats] = useState<MarketSessionStats[]>([]);

  useEffect(() => {
    const symbols = SPOT_MARKETS.map((market) => market.symbol);

    const load = async () => {
      const response = await getMarketStats(symbols);
      setStats(response.stats);
    };

    void load();
    const id = window.setInterval(() => void load(), 30000);

    return () => window.clearInterval(id);
  }, []);

  const movers = useMemo(() => {
    const bySymbol = new Map(stats.map((item) => [item.symbol, item]));

    return SPOT_MARKETS
      .map((market) => ({
        market,
        stats: bySymbol.get(market.symbol),
      }))
      .filter((item): item is { market: (typeof SPOT_MARKETS)[number]; stats: MarketSessionStats } =>
        Boolean(item.stats)
      )
      .sort((a, b) => Math.abs(b.stats.changePercent) - Math.abs(a.stats.changePercent))
      .slice(0, 4);
  }, [stats]);

  const totalVolume = stats.reduce((sum, item) => sum + item.volumeUsd, 0);

  return (
    <div className="exchange-ticker">
      <span className="ticker-lead">Top Movers</span>
      {movers.length === 0 && <span>No market movement yet</span>}
      {movers.map(({ market, stats: item }) => (
        <span key={market.symbol} className={item.changePercent >= 0 ? "market-green" : "market-red"}>
          {market.displaySymbol} {formatPrice(item.close)} {formatPercent(item.changePercent)}
        </span>
      ))}
      <span>24h Volume {totalVolume > 0 ? `$${formatPrice(totalVolume)}` : "-"}</span>
    </div>
  );
}
