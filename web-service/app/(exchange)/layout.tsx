import Header from "@/components/layout/Header";
import TradingPanel from "@/components/layout/TradingPanel";

const movers = [
  "Top Movers",
  "SOL/USD $84.37",
  "BTC/USD $63,420",
  "ETH/USD $3,180",
  "DOGE/USD $0.1098",
  "Hourly Yield $0.00",
];

export default function ExchangeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--app-bg, #0b0e11)",
        color: "var(--app-fg, white)",
        overflow: "hidden",
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateRows: "minmax(0, 1fr) 180px",
          gap: 10,
          padding: 10,
        }}
      >
        <div
          style={{
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "minmax(520px, 1fr) minmax(260px, 360px) minmax(300px, 400px)",
            gap: 10,
          }}
        >
          {children}
        </div>

        <TradingPanel />
      </main>

      <div
        style={{
          height: 34,
          flex: "0 0 34px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "0 14px",
          borderTop: "1px solid var(--app-border, #20242d)",
          background: "#101319",
          color: "#9ca3af",
          fontSize: 13,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {movers.map((item, index) => (
          <span key={item} style={{ color: index === 0 ? "#f4f4f5" : undefined }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
