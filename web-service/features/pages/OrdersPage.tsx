"use client";

import { useEffect, useState } from "react";
import { cancelOrder, getOpenOrders } from "@/services/api";

type OrderRow = {
  id: string;
  symbol: string;
  price: number | null;
  quantity: number;
  side: string;
  type: string;
  status: string;
  createdAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderId, setCancelingOrderId] = useState("");
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token") || "";
      const data = await getOpenOrders(token);
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Orders failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();

    const onOrdersUpdated = () => {
      void loadOrders();
    };

    window.addEventListener("veltrix:orders-updated", onOrdersUpdated);

    return () => {
      window.removeEventListener("veltrix:orders-updated", onOrdersUpdated);
    };
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    setCancelingOrderId(orderId);
    setError("");

    try {
      const token = localStorage.getItem("token") || "";
      await cancelOrder(token, orderId);
      setOrders((current) => current.filter((order) => order.id !== orderId));
      window.dispatchEvent(new Event("veltrix:orders-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel order failed");
    } finally {
      setCancelingOrderId("");
    }
  };

  return (
    <section style={{ gridColumn: "span 3", minHeight: 0, border: "1px solid var(--app-border, #20242d)", borderRadius: 8, background: "var(--app-panel, #11141c)", padding: 14, overflow: "auto" }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>Pending Orders</h1>
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1.1fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr", gap: 12, color: "#a1a1aa", fontSize: 13 }}>
        <strong>Symbol</strong>
        <strong>Side</strong>
        <strong>Type</strong>
        <strong>Price</strong>
        <strong>Quantity</strong>
        <strong>Created</strong>
        <strong>Action</strong>
        {loading && <span style={{ gridColumn: "span 7" }}>Loading orders...</span>}
        {error && <span style={{ gridColumn: "span 7", color: "#ef4444" }}>{error}</span>}
        {!loading && !error && orders.length === 0 && <span style={{ gridColumn: "span 7", color: "#71717a" }}>No pending orders.</span>}
        {orders.flatMap((order) => [
          <span key={`${order.id}-symbol`} style={{ color: "#f4f4f5" }}>{order.symbol}</span>,
          <span key={`${order.id}-side`} style={{ color: order.side === "buy" ? "#22c55e" : "#ef4444", textTransform: "uppercase" }}>{order.side}</span>,
          <span key={`${order.id}-type`}>{order.type}</span>,
          <span key={`${order.id}-price`}>{order.price ?? "-"}</span>,
          <span key={`${order.id}-qty`}>{order.quantity}</span>,
          <span key={`${order.id}-created`}>{new Date(order.createdAt).toLocaleString()}</span>,
          <button
            key={`${order.id}-delete`}
            type="button"
            onClick={() => void handleCancelOrder(order.id)}
            disabled={cancelingOrderId === order.id}
            style={{ height: 30, border: "1px solid rgba(248, 113, 113, 0.35)", borderRadius: 8, background: "rgba(127, 29, 29, 0.18)", color: "#fca5a5", fontWeight: 800 }}
          >
            {cancelingOrderId === order.id ? "Cancelling..." : "Delete"}
          </button>,
        ])}
      </div>
    </section>
  );
}
