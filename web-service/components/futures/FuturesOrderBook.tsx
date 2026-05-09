import type { MarketConfig } from "@veltrix/config/markets";

type FuturesOrderBookProps = {
  market: MarketConfig;
};

export default function FuturesOrderBook({ market }: FuturesOrderBookProps) {
  const mid = Number(market.price.replace(/,/g, ""));
  const format = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: mid > 1000 ? 1 : 2,
      maximumFractionDigits: mid > 1000 ? 1 : 2,
    });
  const levels = [
    { price: format(mid * 1.003), size: "1.20", side: "ask" },
    { price: format(mid * 1.002), size: "0.74", side: "ask" },
    { price: format(mid * 0.999), size: "2.60", side: "bid" },
    { price: format(mid * 0.998), size: "0.95", side: "bid" },
  ];

  return (
    <div style={{ padding: 12, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", color: "#71717a", fontSize: 12 }}>
        <span>Price</span>
        <span style={{ textAlign: "right" }}>Contracts</span>
      </div>
      {levels.map(({ price, size, side }, index) => (
        <div
          key={`${market.symbol}-${side}-${index}`}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            color: side === "bid" ? "#22c55e" : "#ef4444",
            fontSize: 13,
          }}
        >
          <span>{price}</span>
          <span style={{ textAlign: "right", color: "#d4d4d8" }}>{size}</span>
        </div>
      ))}
    </div>
  );
}
