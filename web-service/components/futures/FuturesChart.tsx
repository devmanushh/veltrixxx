import type { MarketConfig } from "@veltrix/config/markets";
import CandleChart from "@/components/trading/CandleChart";

type FuturesChartProps = {
  market: MarketConfig;
};

export default function FuturesChart({ market }: FuturesChartProps) {
  return <CandleChart market={market} />;
}
