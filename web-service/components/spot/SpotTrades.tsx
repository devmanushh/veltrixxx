import type { MarketConfig } from "@veltrix/config/markets";

type SpotTradesProps = {
  market: MarketConfig;
};

const makeTrades = (market: MarketConfig) => {
  const mid = Number(market.price.replace(/,/g, ""));
  const format = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: mid > 1000 ? 1 : 2,
      maximumFractionDigits: mid > 1000 ? 1 : 2,
    });

  return [
    [format(mid), "0.081", "Buy"],
    [format(mid * 0.9999), "0.240", "Sell"],
    [format(mid * 0.9996), "0.015", "Buy"],
    [format(mid * 0.9992), "0.600", "Sell"],
  ];
};

export default function SpotTrades({ market }: SpotTradesProps) {
  const trades = makeTrades(market);

  return (
    <div style={{ padding: 12, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", color: "#71717a", fontSize: 12 }}>
        <span>Price</span>
        <span>Amount</span>
        <span>Side</span>
      </div>
      {trades.map(([price, amount, side], index) => (
        <div
          key={`${market.symbol}-trade-${index}`}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", color: "#d4d4d8", fontSize: 13 }}
        >
          <span style={{ color: side === "Buy" ? "#22c55e" : "#ef4444" }}>{price}</span>
          <span>{amount}</span>
          <span>{side}</span>
        </div>
      ))}
    </div>
  );
}
