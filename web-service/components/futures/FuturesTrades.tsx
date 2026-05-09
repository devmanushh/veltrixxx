import type { MarketConfig } from "@veltrix/config/markets";

type FuturesTradesProps = {
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
    [format(mid * 1.0001), "0.420", "Long"],
    [format(mid * 0.9999), "0.180", "Short"],
    [format(mid * 0.9997), "1.250", "Long"],
    [format(mid * 0.9994), "0.760", "Short"],
  ];
};

export default function FuturesTrades({ market }: FuturesTradesProps) {
  const trades = makeTrades(market);
  return (
    <div style={{ padding: 12, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", color: "#71717a", fontSize: 12 }}>
        <span>Price</span>
        <span>Size</span>
        <span>Side</span>
      </div>
      {trades.map(([price, size, side], index) => (
        <div
          key={`${market.symbol}-trade-${index}`}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", color: "#d4d4d8", fontSize: 13 }}
        >
          <span style={{ color: side === "Long" ? "#22c55e" : "#ef4444" }}>{price}</span>
          <span>{size}</span>
          <span>{side}</span>
        </div>
      ))}
    </div>
  );
}
