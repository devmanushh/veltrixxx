"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { confirmStripeCheckout, createStripeCheckout } from "@/lib/api";
import { useWalletStore } from "@/wallet/stores/walletStore";

const formatUsd = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

export default function Page() {
  const wallet = useWalletStore((state) => state.wallet);
  const setWallet = useWalletStore((state) => state.setWallet);
  const loadWallet = useWalletStore((state) => state.loadWallet);
  const loading = useWalletStore((state) => state.loading);
  const walletError = useWalletStore((state) => state.error);
  const [amountUsd, setAmountUsd] = useState("50");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const initializeWalletPage = async () => {
      try {
        setError("");
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");
        const payment = params.get("payment");

        if (payment === "success" && sessionId) {
          const confirmed = await confirmStripeCheckout(sessionId);
          setWallet(confirmed.wallet);
          window.dispatchEvent(new Event("veltrix:wallet-updated"));
          const nextMessage = confirmed.credited ? "Wallet topped up successfully." : "Payment already added to wallet.";
          setMessage(nextMessage);
          toast.success(nextMessage);
          window.history.replaceState({}, "", "/balance");
          return;
        }

        if (payment === "cancelled") {
          setMessage("Payment cancelled.");
          toast.message("Payment cancelled");
          window.history.replaceState({}, "", "/balance");
        }

        await loadWallet();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Wallet failed";
        setError(message);
        toast.error("Wallet failed", { description: message });
      }
    };

    void initializeWalletPage();
  }, [loadWallet, setWallet]);

  const handleTopUp = async () => {
    setPaymentLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await createStripeCheckout(Number(amountUsd));
      toast.message("Opening Stripe checkout");
      window.location.href = data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setError(message);
      toast.error("Payment failed", { description: message });
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <>
      <section className="exchange-panel content-panel">
        <h1 className="panel-heading">Wallet</h1>
        <p className="section-copy">Trading funds are reserved from this wallet when you place an order.</p>
        <strong className="market-num wallet-total">
          {loading ? "Loading..." : formatUsd(wallet?.balance || 0)}
        </strong>
        <span className="text-dim">
          {wallet?.email || "Signed in wallet"}
        </span>
      </section>

      <section className="exchange-panel content-panel">
        <h2 className="panel-heading">Top Up</h2>
        <label className="form-label form-label-spaced">
          Amount USD
          <input
            value={amountUsd}
            onChange={(event) => setAmountUsd(event.target.value)}
            inputMode="decimal"
            className="form-input"
          />
        </label>
        <button
          type="button"
          onClick={handleTopUp}
          disabled={paymentLoading}
          className="primary-button full-button"
        >
          {paymentLoading ? "Opening Stripe..." : "Top Up With Stripe"}
        </button>
        {(error || walletError) && <p className="text-danger">{error || walletError}</p>}
        {message && <p className="text-success">{message}</p>}
      </section>

      <section className="exchange-panel content-panel scroll-panel">
        <h2 className="panel-heading">Balance</h2>
        <div className="wallet-grid">
          <strong>Asset</strong>
          <strong>Available</strong>
          <span>USD</span>
          <span className="market-num text-strong">{formatUsd(wallet?.balance || 0)}</span>
          {wallet?.assetBalances?.flatMap((assetBalance) => [
            <span key={`${assetBalance.asset}-asset`}>{assetBalance.asset}</span>,
            <span key={`${assetBalance.asset}-balance`} className="market-num text-strong">
              {assetBalance.free.toLocaleString("en-US", { maximumFractionDigits: 8 })}
              {assetBalance.locked > 0 ? ` (${assetBalance.locked.toLocaleString("en-US", { maximumFractionDigits: 8 })} locked)` : ""}
            </span>,
          ])}
        </div>
      </section>
    </>
  );
}
