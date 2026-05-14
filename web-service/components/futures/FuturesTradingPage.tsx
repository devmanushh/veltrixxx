"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getMarketByApiSymbol,
  getMarketRoutePath,
} from "@veltrix/config/markets";
import OrderForm from "@/components/forms/OrderForm";
import FuturesChart from "@/components/futures/FuturesChart";
import FuturesMarketBar from "@/components/futures/FuturesMarketBar";
import MarketActivityPanel from "@/components/trading/MarketActivityPanel";
import { useMarketStore } from "@/stores/marketStore";

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
        <FuturesMarketBar onMarketChange={handleMarketChange} />
        <FuturesChart />
      </div>
      <MarketActivityPanel marketKind="futures" />
      <OrderForm marketKind="futures" />
    </>
  );
}
