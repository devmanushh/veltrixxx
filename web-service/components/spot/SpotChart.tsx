import type { MarketConfig } from "@veltrix/config/markets";
import CandleChart from "@/components/trading/CandleChart";

type SpotChartProps = {
  market: MarketConfig;
};

export default function SpotChart({ market }: SpotChartProps) {
  return <CandleChart market={market} />;
}
