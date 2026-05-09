"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDefaultMarket,
  getMarketByApiSymbol,
  getMarketBySymbol,
  getMarketRoutePath,
  SPOT_MARKETS,
} from "@veltrix/config/markets";
import OrderForm from "@/components/forms/OrderForm";
import SpotChart from "@/components/spot/SpotChart";
import SpotMarketBar from "@/components/spot/SpotMarketBar";
import SpotOrderBook from "@/components/spot/SpotOrderBook";
import SpotTrades from "@/components/spot/SpotTrades";
import MarketActivityPanel from "@/components/trading/MarketActivityPanel";

type SpotPageProps = {
  marketParam?: string;
};

export default function SpotPage({ marketParam }: SpotPageProps) {
  const router = useRouter();
  const [selectedSymbol, setSelectedSymbol] = useState(() =>
    marketParam ? getMarketByApiSymbol("spot", marketParam).symbol : getDefaultMarket("spot").symbol
  );
  const selectedMarket = getMarketBySymbol("spot", selectedSymbol);

  useEffect(() => {
    if (marketParam) {
      setSelectedSymbol(getMarketByApiSymbol("spot", marketParam).symbol);
    }
  }, [marketParam]);

  const handleMarketChange = (symbol: string) => {
    const nextMarket = getMarketBySymbol("spot", symbol);
    setSelectedSymbol(nextMarket.symbol);
    router.push(getMarketRoutePath("spot", nextMarket));
  };

  return (
    <>
      <div style={{ minHeight: 0, display: "grid", gridTemplateRows: "76px minmax(0, 1fr)", gap: 10 }}>
        <SpotMarketBar
          markets={SPOT_MARKETS}
          selectedMarket={selectedMarket}
          onMarketChange={handleMarketChange}
        />
        <SpotChart market={selectedMarket} />
      </div>
      <MarketActivityPanel
        orderBook={<SpotOrderBook market={selectedMarket} />}
        trades={<SpotTrades market={selectedMarket} />}
      />
      <OrderForm market={selectedMarket} marketKind="spot" />
    </>
  );
}
