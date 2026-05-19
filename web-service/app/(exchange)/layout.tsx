import Header from "@/layout/components/Header";
import TradingPanel from "@/layout/components/TradingPanel";
import ExchangeTicker from "@/layout/components/ExchangeTicker";

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

      <ExchangeTicker />
    </div>
  );
}
