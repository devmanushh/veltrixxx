import AssetList from "@/components/portfolio/AssetList";
import PortfolioOverview from "@/components/portfolio/PortfolioOverview";

export default function PortfolioPage() {
  return (
    <>
      <PortfolioOverview />
      <AssetList />
      <section style={{ minHeight: 0, border: "1px solid var(--app-border, #20242d)", borderRadius: 8, background: "var(--app-panel, #11141c)", padding: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Allocation</h2>
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {["BTC 48%", "ETH 31%", "USDT 16%", "SOL 5%"].map((item) => (
            <div key={item} style={{ display: "flex", justifyContent: "space-between", color: "#d4d4d8" }}>
              <span>{item.split(" ")[0]}</span>
              <strong>{item.split(" ")[1]}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
