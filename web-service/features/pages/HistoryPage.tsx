"use client";

import { useEffect, useState } from "react";
import { getTradeHistory } from "@/services/api";

type TradeRow = {
  id: string;
  buyerId: string;
  sellerId: string;
  symbol: string;
  price: number;
  quantity: number;
  createdAt: string;
};

export default function HistoryPage() {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTrades = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserId(user.id || "");
        const data = await getTradeHistory(token);
        setTrades(data.trades || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Trade history failed");
      } finally {
        setLoading(false);
      }
    };

    void loadTrades();
  }, []);

  return (
    <section style={{ gridColumn: "span 3", minHeight: 0, border: "1px solid var(--app-border, #20242d)", borderRadius: 8, background: "var(--app-panel, #11141c)", padding: 14, overflow: "auto" }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>Trade History</h1>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1.1fr 0.8fr 0.8fr 0.8fr 1fr", gap: 12, color: "#a1a1aa", fontSize: 13 }}>
        <strong>Symbol</strong>
        <strong>Side</strong>
        <strong>Price</strong>
        <strong>Quantity</strong>
        <strong>Time</strong>
        {loading && <span style={{ gridColumn: "span 5" }}>Loading trades...</span>}
        {error && <span style={{ gridColumn: "span 5", color: "#ef4444" }}>{error}</span>}
        {!loading && !error && trades.length === 0 && <span style={{ gridColumn: "span 5", color: "#71717a" }}>No trades yet.</span>}
        {trades.flatMap((trade) => {
          const side = trade.buyerId === userId ? "buy" : "sell";

          return [
            <span key={`${trade.id}-symbol`} style={{ color: "#f4f4f5" }}>{trade.symbol}</span>,
            <span key={`${trade.id}-side`} style={{ color: side === "buy" ? "#22c55e" : "#ef4444", textTransform: "uppercase" }}>{side}</span>,
            <span key={`${trade.id}-price`}>{trade.price}</span>,
            <span key={`${trade.id}-qty`}>{trade.quantity}</span>,
            <span key={`${trade.id}-created`}>{new Date(trade.createdAt).toLocaleString()}</span>,
          ];
        })}
      </div>
    </section>
  );
}
