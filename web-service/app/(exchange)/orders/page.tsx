"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useActivityStore } from "@/activity/stores/activityStore";

export default function Page() {
  const orders = useActivityStore((state) => state.orders);
  const loading = useActivityStore((state) => state.loading);
  const error = useActivityStore((state) => state.error);
  const cancelingOrderId = useActivityStore((state) => state.cancelingOrderId);
  const loadActivity = useActivityStore((state) => state.loadActivity);
  const cancelOrderById = useActivityStore((state) => state.cancelOrderById);

  useEffect(() => {
    void loadActivity();

    const onOrdersUpdated = () => {
      void loadActivity();
    };

    window.addEventListener("veltrix:orders-updated", onOrdersUpdated);

    return () => {
      window.removeEventListener("veltrix:orders-updated", onOrdersUpdated);
    };
  }, [loadActivity]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrderById(orderId);
      toast.success("Order cancelled");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cancel order failed";
      toast.error("Cancel failed", { description: message });
    }
  };

  return (
    <section className="exchange-panel full-width-panel">
      <h1 className="panel-heading">Pending Orders</h1>
      <div className="data-grid orders-grid">
        <strong>Symbol</strong>
        <strong>Side</strong>
        <strong>Type</strong>
        <strong>Price</strong>
        <strong>Quantity</strong>
        <strong>Created</strong>
        <strong>Action</strong>
        {loading && <span className="span-7">Loading orders...</span>}
        {error && <span className="span-7 text-danger">{error}</span>}
        {!loading && !error && orders.length === 0 && <span className="span-7 text-dim">No pending orders.</span>}
        {orders.flatMap((order) => [
          <span key={`${order.id}-symbol`} className="text-strong">{order.symbol}</span>,
          <span key={`${order.id}-side`} className={order.side === "buy" ? "market-green" : "market-red"}>{order.side}</span>,
          <span key={`${order.id}-type`}>{order.type}</span>,
          <span className="market-num" key={`${order.id}-price`}>{order.price ?? "-"}</span>,
          <span className="market-num" key={`${order.id}-qty`}>{order.quantity}</span>,
          <span key={`${order.id}-created`}>{new Date(order.createdAt).toLocaleString()}</span>,
          <button
            key={`${order.id}-delete`}
            type="button"
            onClick={() => void handleCancelOrder(order.id)}
            disabled={cancelingOrderId === order.id}
            className="danger-button"
          >
            {cancelingOrderId === order.id ? "Cancelling..." : "Delete"}
          </button>,
        ])}
      </div>
    </section>
  );
}
