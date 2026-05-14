import MarketStatsBar from "@/components/trading/MarketStatsBar";

type FuturesMarketBarProps = {
  onMarketChange: (symbol: string) => void;
};

export default function FuturesMarketBar({ onMarketChange }: FuturesMarketBarProps) {
  return <MarketStatsBar marketKind="futures" onMarketChange={onMarketChange} />;
}
