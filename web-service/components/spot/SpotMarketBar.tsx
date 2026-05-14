import MarketStatsBar from "@/components/trading/MarketStatsBar";

type SpotMarketBarProps = {
  onMarketChange: (symbol: string) => void;
};

export default function SpotMarketBar({ onMarketChange }: SpotMarketBarProps) {
  return <MarketStatsBar marketKind="spot" onMarketChange={onMarketChange} />;
}
