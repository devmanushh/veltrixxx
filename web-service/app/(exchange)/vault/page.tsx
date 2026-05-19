import EarnProducts from "@/vault/components/EarnProducts";
import VaultOverview from "@/vault/components/VaultOverview";

export default function Page() {
  return (
    <>
      <VaultOverview />
      <EarnProducts />
      <section className="exchange-panel content-panel">
        <h2 className="panel-title">Yield Activity</h2>
        <div className="simple-grid">
          <span>USDT Flexible: +12.42 USDT</span>
          <span>ETH Staking: +0.018 ETH</span>
          <span>Next payout: 08:00 UTC</span>
        </div>
      </section>
    </>
  );
}
