import AssetList from "@/components/portfolio/AssetList";
import PortfolioOverview from "@/components/portfolio/PortfolioOverview";

export default function Page() {
  return (
    <>
      <PortfolioOverview />
      <AssetList />
      <section className="exchange-panel content-panel">
        <h2 className="panel-title">Allocation</h2>
        <div className="simple-grid">
          {["BTC 48%", "ETH 31%", "USDT 16%", "SOL 5%"].map((item) => (
            <div key={item} className="split-row text-strong">
              <span>{item.split(" ")[0]}</span>
              <strong>{item.split(" ")[1]}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
