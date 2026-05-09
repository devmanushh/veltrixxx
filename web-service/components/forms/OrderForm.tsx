"use client";

import { useEffect, useState } from "react";
import type { MarketConfig, MarketKind } from "@veltrix/config/markets";
import { placeOrder } from "@/services/api";

type OrderFormProps = {
  market: MarketConfig;
  marketKind: MarketKind;
};

export default function OrderForm({ market, marketKind }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [price, setPrice] = useState(market.price.replace(/,/g, ""));
  const [quantity, setQuantity] = useState("1");

  const orderValue = Number(price || 0) * Number(quantity || 0);
  const valueUnit = marketKind === "spot" ? "USDT" : "DEV";

  useEffect(() => {
    setPrice(market.price.replace(/,/g, ""));
    setQuantity("1");
  }, [market.symbol, market.price]);

  const sendOrder = async (side: "buy" | "sell") => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      const order = {
        symbol: market.symbol,
        price: Number(price),
        quantity: Number(quantity),
        side,
        type: "limit"
      };

      const res = await placeOrder(order, token || "", marketKind, market.apiSymbol);

      setSuccess(res.message || "Order sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{
        minHeight: 0,
        border: "1px solid var(--app-border, #20242d)",
        borderRadius: 8,
        background: "var(--app-panel, #11141c)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 18 }}>{marketKind === "spot" ? "Spot Trading" : "Futures Trading"}</h2>
        <p style={{ margin: "6px 0 0", color: "#a1a1aa", fontSize: 13 }}>
          {market.selectorLabel} limit order
        </p>
      </div>

      <label style={{ display: "grid", gap: 6, color: "#a1a1aa", fontSize: 12 }}>
        Price ({marketKind === "spot" ? "USDT" : "USD"})
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          inputMode="decimal"
          style={{
            height: 40,
            border: "1px solid var(--app-border, #20242d)",
            borderRadius: 8,
            background: "#0b0e11",
            color: "#f4f4f5",
            padding: "0 12px",
          }}
        />
      </label>

      <label style={{ display: "grid", gap: 6, color: "#a1a1aa", fontSize: 12 }}>
        Quantity ({market.base})
        <input
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          inputMode="decimal"
          style={{
            height: 40,
            border: "1px solid var(--app-border, #20242d)",
            borderRadius: 8,
            background: "#0b0e11",
            color: "#f4f4f5",
            padding: "0 12px",
          }}
        />
      </label>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#a1a1aa",
          fontSize: 13,
        }}
      >
        <span>Order Value</span>
        <strong style={{ color: "#f4f4f5" }}>
          {Number.isFinite(orderValue) ? orderValue.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0"}{" "}
          {valueUnit}
        </strong>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          type="button"
          disabled={loading}
          onClick={() => sendOrder("buy")}
          style={{
            height: 42,
            border: 0,
            borderRadius: 8,
            background: "#16a34a",
            color: "#ffffff",
            fontWeight: 800,
            cursor: loading ? "default" : "pointer",
          }}
        >
          Buy {market.base}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => sendOrder("sell")}
          style={{
            height: 42,
            border: 0,
            borderRadius: 8,
            background: "#dc2626",
            color: "#ffffff",
            fontWeight: 800,
            cursor: loading ? "default" : "pointer",
          }}
        >
          Sell {market.base}
        </button>
      </div>

      {loading && <p style={{ margin: 0, color: "#a1a1aa" }}>Sending order...</p>}
      {success && <p style={{ margin: 0, color: "#22c55e" }}>{success}</p>}
      {error && <p style={{ margin: 0, color: "#ef4444" }}>{error}</p>}
    </section>
  );
}
