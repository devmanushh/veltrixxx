"use client";

import { useEffect } from "react";
import { useActivityStore } from "@/activity/stores/activityStore";

export default function Page() {
  const trades = useActivityStore((state) => state.trades);
  const userId = useActivityStore((state) => state.userId);
  const loading = useActivityStore((state) => state.loading);
  const error = useActivityStore((state) => state.error);
  const loadActivity = useActivityStore((state) => state.loadActivity);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  return (
    <section className="exchange-panel full-width-panel">
      <h1 className="panel-heading">Trade History</h1>
      <div className="data-grid history-grid">
        <strong>Symbol</strong>
        <strong>Side</strong>
        <strong>Price</strong>
        <strong>Quantity</strong>
        <strong>Time</strong>
        {loading && <span className="span-5">Loading trades...</span>}
        {error && <span className="span-5 text-danger">{error}</span>}
        {!loading && !error && trades.length === 0 && <span className="span-5 text-dim">No trades yet.</span>}
        {trades.flatMap((trade) => {
          const side = trade.buyerId === userId ? "buy" : "sell";

          return [
            <span key={`${trade.id}-symbol`} className="text-strong">{trade.symbol}</span>,
            <span key={`${trade.id}-side`} className={side === "buy" ? "market-green" : "market-red"}>{side}</span>,
            <span className="market-num" key={`${trade.id}-price`}>{trade.price}</span>,
            <span className="market-num" key={`${trade.id}-qty`}>{trade.quantity}</span>,
            <span key={`${trade.id}-created`}>{new Date(trade.createdAt).toLocaleString()}</span>,
          ];
        })}
      </div>
    </section>
  );
}
