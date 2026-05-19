"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getMarketByApiSymbol,
  getMarketRoutePath,
} from "@veltrix/config/markets";
import OrderForm from "@/trading/components/shared/OrderForm";
import CandleChart from "@/trading/components/shared/CandleChart";
import MarketActivityPanel from "@/trading/components/shared/MarketActivityPanel";
import MarketStatsBar from "@/trading/components/shared/MarketStatsBar";
import { useMarketStore } from "@/trading/stores/marketStore";

type SpotTradingPageProps = {
  marketParam?: string;
};

export default function SpotTradingPage({ marketParam }: SpotTradingPageProps) {
  const router = useRouter();
  const setSelectedSymbol = useMarketStore((state) => state.setSelectedSymbol);

  useEffect(() => {
    if (marketParam) {
      setSelectedSymbol("spot", getMarketByApiSymbol("spot", marketParam).symbol);
    }
  }, [marketParam, setSelectedSymbol]);

  const handleMarketChange = (symbol: string) => {
    setSelectedSymbol("spot", symbol);
    const nextMarket = useMarketStore.getState().getSelectedMarket("spot");
    router.push(getMarketRoutePath("spot", nextMarket));
  };

  return (
    <>
      <div className="exchange-market-stack">
        <MarketStatsBar marketKind="spot" onMarketChange={handleMarketChange} />
        <CandleChart marketKind="spot" />
      </div>
      <MarketActivityPanel marketKind="spot" />
      <OrderForm marketKind="spot" />
    </>
  );
}
