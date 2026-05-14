"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getMarketByApiSymbol,
  getMarketRoutePath,
} from "@veltrix/config/markets";
import OrderForm from "@/components/forms/OrderForm";
import SpotChart from "@/components/spot/SpotChart";
import SpotMarketBar from "@/components/spot/SpotMarketBar";
import MarketActivityPanel from "@/components/trading/MarketActivityPanel";
import { useMarketStore } from "@/stores/marketStore";

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
        <SpotMarketBar onMarketChange={handleMarketChange} />
        <SpotChart />
      </div>
      <MarketActivityPanel marketKind="spot" />
      <OrderForm marketKind="spot" />
    </>
  );
}
