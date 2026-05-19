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

type FuturesTradingPageProps = {
  marketParam?: string;
};

export default function FuturesTradingPage({ marketParam }: FuturesTradingPageProps) {
  const router = useRouter();
  const setSelectedSymbol = useMarketStore((state) => state.setSelectedSymbol);

  useEffect(() => {
    if (marketParam) {
      setSelectedSymbol("futures", getMarketByApiSymbol("futures", marketParam).symbol);
    }
  }, [marketParam, setSelectedSymbol]);

  const handleMarketChange = (symbol: string) => {
    setSelectedSymbol("futures", symbol);
    const nextMarket = useMarketStore.getState().getSelectedMarket("futures");
    router.push(getMarketRoutePath("futures", nextMarket));
  };

  return (
    <>
      <div className="exchange-market-stack">
        <MarketStatsBar marketKind="futures" onMarketChange={handleMarketChange} />
        <CandleChart marketKind="futures" />
      </div>
      <MarketActivityPanel marketKind="futures" />
      <OrderForm marketKind="futures" />
    </>
  );
}
