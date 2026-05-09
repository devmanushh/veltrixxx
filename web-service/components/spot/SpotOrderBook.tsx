import type { MarketConfig } from "@veltrix/config/markets";

type SpotOrderBookProps = {
  market: MarketConfig;
};

const makeLevels = (price: string) => {
  const mid = Number(price.replace(/,/g, ""));
  const format = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: mid > 1000 ? 1 : 2,
      maximumFractionDigits: mid > 1000 ? 1 : 2,
    });

  return {
    asks: [
      [format(mid * 1.003), "0.42"],
      [format(mid * 1.002), "0.18"],
      [format(mid * 1.001), "1.25"],
    ],
    bids: [
      [format(mid * 0.999), "0.64"],
      [format(mid * 0.998), "0.91"],
      [format(mid * 0.997), "1.70"],
    ],
  };
};

export default function SpotOrderBook({ market }: SpotOrderBookProps) {
  const { asks, bids } = makeLevels(market.price);

  return (
    <div style={{ padding: 12, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", color: "#71717a", fontSize: 12 }}>
        <span>Price</span>
        <span style={{ textAlign: "right" }}>Size</span>
      </div>
      {asks.map(([price, size], index) => (
        <div key={`${market.symbol}-ask-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", color: "#ef4444", fontSize: 13 }}>
          <span>{price}</span>
          <span style={{ textAlign: "right", color: "#d4d4d8" }}>{size}</span>
        </div>
      ))}
      <strong style={{ color: "#f4f4f5", fontSize: 18 }}>{market.price}</strong>
      {bids.map(([price, size], index) => (
        <div key={`${market.symbol}-bid-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", color: "#22c55e", fontSize: 13 }}>
          <span>{price}</span>
          <span style={{ textAlign: "right", color: "#d4d4d8" }}>{size}</span>
        </div>
      ))}
    </div>
  );
}
