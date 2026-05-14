"use client";

import { useEffect, useState } from "react";
import type { MarketKind } from "@veltrix/config/markets";
import { toast } from "sonner";
import { placeOrder } from "@/lib/api";
import { useLiveMarketStore } from "@/stores/liveMarketStore";
import { useSelectedMarket } from "@/stores/marketStore";
import { useWalletStore } from "@/stores/walletStore";

type OrderFormProps = {
  marketKind: MarketKind;
};

export default function OrderForm({ marketKind }: OrderFormProps) {
  const market = useSelectedMarket(marketKind);
  const referencePrice = useLiveMarketStore((state) => state.getReferencePrice(market.symbol));
  const refreshWallet = useWalletStore((state) => state.loadWallet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const orderValue = Number(price || 0) * Number(quantity || 0);
  const valueUnit = marketKind === "spot" ? "USDT" : "DEV";

  useEffect(() => {
    setPrice(referencePrice ? String(referencePrice) : "");
    setQuantity("1");
  }, [market.symbol, referencePrice]);

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
      await refreshWallet();
      window.dispatchEvent(new Event("veltrix:orders-updated"));
      toast.success(`${side === "buy" ? "Buy" : "Sell"} order sent`, {
        description: `${quantity} ${market.base} at ${price}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Order failed";
      setError(message);
      toast.error("Order failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="exchange-panel order-form"
    >
      <div className="order-form-header">
        <h2 className="panel-title">{marketKind === "spot" ? "Spot Trading" : "Futures Trading"}</h2>
        <p className="text-muted">
          {market.selectorLabel} limit order
        </p>
      </div>

      <label className="form-label">
        Price ({marketKind === "spot" ? "USDT" : "USD"})
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          inputMode="decimal"
          className="form-input"
        />
      </label>

      <label className="form-label">
        Quantity ({market.base})
        <input
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          inputMode="decimal"
          className="form-input"
        />
      </label>

      <div className="order-value-row">
        <span>Order Value</span>
        <strong className="market-num text-strong">
          {Number.isFinite(orderValue) ? orderValue.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0"}{" "}
          {valueUnit}
        </strong>
      </div>

      <div className="market-stack-actions">
        <button
          type="button"
          disabled={loading}
          onClick={() => sendOrder("buy")}
          className="buy-button"
        >
          Buy {market.base}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => sendOrder("sell")}
          className="sell-button"
        >
          Sell {market.base}
        </button>
      </div>

      {loading && <p className="text-muted">Sending order...</p>}
      {success && <p className="text-success">{success}</p>}
      {error && <p className="text-danger">{error}</p>}
    </section>
  );
}
