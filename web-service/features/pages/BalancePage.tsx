"use client";

import { useEffect, useState } from "react";
import { confirmStripeCheckout, createStripeCheckout, getWallet } from "@/services/api";

type Wallet = {
  id: string;
  email: string;
  balance: number;
};

const formatUsd = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

export default function BalancePage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amountUsd, setAmountUsd] = useState("50");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadWallet = async () => {
      try {
        setError("");
        const token = localStorage.getItem("token") || "";
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");
        const payment = params.get("payment");

        if (payment === "success" && sessionId) {
          const confirmed = await confirmStripeCheckout(token, sessionId);
          setWallet(confirmed.wallet);
          setMessage(confirmed.credited ? "Wallet topped up successfully." : "Payment already added to wallet.");
          window.history.replaceState({}, "", "/balance");
          return;
        }

        if (payment === "cancelled") {
          setMessage("Payment cancelled.");
          window.history.replaceState({}, "", "/balance");
        }

        const walletData = await getWallet(token);
        setWallet(walletData.wallet);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wallet failed");
      } finally {
        setLoading(false);
      }
    };

    void loadWallet();
  }, []);

  const handleTopUp = async () => {
    setPaymentLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token") || "";
      const data = await createStripeCheckout(token, Number(amountUsd));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <>
      <section style={{ minHeight: 0, border: "1px solid var(--app-border, #20242d)", borderRadius: 8, background: "var(--app-panel, #11141c)", padding: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Wallet</h1>
        <p style={{ margin: "10px 0 0", color: "#a1a1aa", fontSize: 13 }}>Trading funds are reserved from this wallet when you place an order.</p>
        <strong style={{ display: "block", marginTop: 18, color: "#f4f4f5", fontSize: 32 }}>
          {loading ? "Loading..." : formatUsd(wallet?.balance || 0)}
        </strong>
        <span style={{ display: "block", marginTop: 8, color: "#71717a", fontSize: 12 }}>
          {wallet?.email || "Signed in wallet"}
        </span>
      </section>

      <section style={{ minHeight: 0, border: "1px solid var(--app-border, #20242d)", borderRadius: 8, background: "var(--app-panel, #11141c)", padding: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Top Up</h2>
        <label style={{ display: "grid", gap: 8, marginTop: 16, color: "#a1a1aa", fontSize: 12 }}>
          Amount USD
          <input
            value={amountUsd}
            onChange={(event) => setAmountUsd(event.target.value)}
            inputMode="decimal"
            style={{ height: 40, border: "1px solid var(--app-border, #20242d)", borderRadius: 8, background: "#0b0e11", color: "#f4f4f5", padding: "0 12px" }}
          />
        </label>
        <button
          type="button"
          onClick={handleTopUp}
          disabled={paymentLoading}
          style={{ width: "100%", height: 42, marginTop: 14, border: 0, borderRadius: 8, background: "#2563eb", color: "#ffffff", fontWeight: 800 }}
        >
          {paymentLoading ? "Opening Stripe..." : "Top Up With Stripe"}
        </button>
        {error && <p style={{ margin: "12px 0 0", color: "#ef4444", fontSize: 13 }}>{error}</p>}
        {message && <p style={{ margin: "12px 0 0", color: "#22c55e", fontSize: 13 }}>{message}</p>}
      </section>

      <section style={{ gridColumn: "span 1", minHeight: 0, border: "1px solid var(--app-border, #20242d)", borderRadius: 8, background: "var(--app-panel, #11141c)", padding: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Balance</h2>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, color: "#a1a1aa", fontSize: 13 }}>
          <strong>Asset</strong>
          <strong>Available</strong>
          <span>USD</span>
          <span style={{ color: "#f4f4f5", fontWeight: 800 }}>{formatUsd(wallet?.balance || 0)}</span>
        </div>
      </section>
    </>
  );
}
