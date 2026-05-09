"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FUTURES_MARKETS,
  getDefaultMarket,
  getMarketByApiSymbol,
  getMarketBySymbol,
  getMarketRoutePath,
} from "@veltrix/config/markets";
import OrderForm from "@/components/forms/OrderForm";
import FuturesChart from "@/components/futures/FuturesChart";
import FuturesOrderBook from "@/components/futures/FuturesOrderBook";
import FuturesTrades from "@/components/futures/FuturesTrades";
import SpotMarketBar from "@/components/spot/SpotMarketBar";
import MarketActivityPanel from "@/components/trading/MarketActivityPanel";

type FuturesPageProps = {
  marketParam?: string;
};

export default function FuturesPage({ marketParam }: FuturesPageProps) {
  const router = useRouter();
  const [selectedSymbol, setSelectedSymbol] = useState(() =>
    marketParam ? getMarketByApiSymbol("futures", marketParam).symbol : getDefaultMarket("futures").symbol
  );
  const selectedMarket = getMarketBySymbol("futures", selectedSymbol);

  useEffect(() => {
    if (marketParam) {
      setSelectedSymbol(getMarketByApiSymbol("futures", marketParam).symbol);
    }
  }, [marketParam]);

  const handleMarketChange = (symbol: string) => {
    const nextMarket = getMarketBySymbol("futures", symbol);
    setSelectedSymbol(nextMarket.symbol);
    router.push(getMarketRoutePath("futures", nextMarket));
  };

  return (
    <>
      <div style={{ minHeight: 0, display: "grid", gridTemplateRows: "76px minmax(0, 1fr)", gap: 10 }}>
        <SpotMarketBar
          markets={FUTURES_MARKETS}
          selectedMarket={selectedMarket}
          onMarketChange={handleMarketChange}
        />
        <FuturesChart market={selectedMarket} />
      </div>
      <MarketActivityPanel
        orderBook={<FuturesOrderBook market={selectedMarket} />}
        trades={<FuturesTrades market={selectedMarket} />}
      />
      <OrderForm market={selectedMarket} marketKind="futures" />
    </>
  );
}
