import type { MarketConfig } from "@veltrix/config/markets";
import MarketStatsBar from "@/components/trading/MarketStatsBar";

type SpotMarketBarProps = {
  markets: MarketConfig[];
  selectedMarket: MarketConfig;
  onMarketChange: (symbol: string) => void;
};

export default function SpotMarketBar(props: SpotMarketBarProps) {
  return <MarketStatsBar {...props} />;
}
