import EarnProducts from "@/components/vault/EarnProducts";
import VaultOverview from "@/components/vault/VaultOverview";

export default function VaultPage() {
  return (
    <>
      <VaultOverview />
      <EarnProducts />
      <section style={{ minHeight: 0, border: "1px solid var(--app-border, #20242d)", borderRadius: 8, background: "var(--app-panel, #11141c)", padding: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Yield Activity</h2>
        <div style={{ marginTop: 14, display: "grid", gap: 10, color: "#d4d4d8" }}>
          <span>USDT Flexible: +12.42 USDT</span>
          <span>ETH Staking: +0.018 ETH</span>
          <span>Next payout: 08:00 UTC</span>
        </div>
      </section>
    </>
  );
}
