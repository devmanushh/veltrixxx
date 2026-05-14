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
    <div className="exchange-shell">
      <Header />

      <main className="exchange-main">
        <div className="exchange-grid">
          {children}
        </div>

        <TradingPanel />
      </main>

      <div className="exchange-ticker">
        {movers.map((item, index) => (
          <span key={item} className={index === 0 ? "ticker-lead" : undefined}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
