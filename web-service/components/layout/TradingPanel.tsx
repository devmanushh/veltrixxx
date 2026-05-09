"use client";

import { useEffect, useState } from "react";
import { cancelOrder, getOpenOrders, getTradeHistory, getWallet } from "@/services/api";

const tabs = ["Orders", "History", "Position", "Balance"] as const;

type Tab = (typeof tabs)[number];

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

type TradeRow = {
  id: string;
  buyerId: string;
  sellerId: string;
  symbol: string;
  price: number;
  quantity: number;
  createdAt: string;
};

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

const formatNumber = (value: number | null) =>
  value === null
    ? "-"
    : value.toLocaleString("en-US", {
        maximumFractionDigits: 8,
      });

const readUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return typeof user.id === "string" ? user.id : "";
  } catch {
    return "";
  }
};

export default function TradingPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelingOrderId, setCancelingOrderId] = useState("");
  const [error, setError] = useState("");

  const loadPanelData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || "";

      if (!token) {
        setOrders([]);
        setTrades([]);
        setWallet(null);
        setError("Login to view trading activity.");
        return;
      }

      setUserId(readUserId());

      const [walletResult, ordersResult, tradesResult] = await Promise.all([
        getWallet(token),
        getOpenOrders(token),
        getTradeHistory(token),
      ]);

      setWallet(walletResult.wallet || null);
      setOrders(ordersResult.orders || []);
      setTrades(tradesResult.trades || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trading panel failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPanelData();

    const onOrdersUpdated = () => {
      void loadPanelData();
    };

    window.addEventListener("veltrix:orders-updated", onOrdersUpdated);

    return () => {
      window.removeEventListener("veltrix:orders-updated", onOrdersUpdated);
    };
  }, []);

  const notifyOrdersUpdated = () => {
    window.dispatchEvent(new Event("veltrix:orders-updated"));
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancelingOrderId(orderId);
    setError("");

    try {
      const token = localStorage.getItem("token") || "";
      await cancelOrder(token, orderId);
      setOrders((current) => current.filter((order) => order.id !== orderId));
      notifyOrdersUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel order failed");
    } finally {
      setCancelingOrderId("");
    }
  };

  return (
    <section
      style={{
        minHeight: 0,
        border: "1px solid var(--app-border, #20242d)",
        borderRadius: 10,
        background: "var(--app-panel, #11141c)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 16px",
          borderBottom: "1px solid var(--app-border, #20242d)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, flex: 1 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                border: 0,
                borderRadius: 8,
                padding: "8px 12px",
                background: activeTab === tab ? "#222632" : "transparent",
                color: activeTab === tab ? "#fff" : "#9ca3af",
                fontWeight: activeTab === tab ? 700 : 500,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void loadPanelData()}
          disabled={loading}
          title="Refresh"
          style={{
            border: "1px solid var(--app-border, #20242d)",
            borderRadius: 8,
            background: "#151923",
            color: "#d4d4d8",
            fontSize: 12,
            fontWeight: 700,
            height: 30,
            padding: "0 10px",
          }}
        >
          {loading ? "Loading" : "Refresh"}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: 12, color: "#9ca3af", overflow: "auto" }}>
        {error && (
          <div style={{ marginBottom: 8, color: error.includes("Login") ? "#a1a1aa" : "#f87171", fontSize: 12 }}>
            {error}
          </div>
        )}

        {activeTab === "Orders" && (
          <PanelGrid columns="1.1fr 0.7fr 0.7fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr">
            <GridHead labels={["Symbol", "Side", "Type", "Price", "Qty", "Status", "Time", "Action"]} />
            {loading && <EmptyRow columns={8}>Loading orders...</EmptyRow>}
            {!loading && orders.length === 0 && <EmptyRow columns={8}>No pending orders.</EmptyRow>}
            {!loading &&
              orders.slice(0, 8).map((order) => (
                <Row key={order.id} columns={8}>
                  <strong style={{ color: "#f4f4f5" }}>{order.symbol}</strong>
                  <span style={{ color: order.side === "buy" ? "#22c55e" : "#ef4444", textTransform: "uppercase" }}>
                    {order.side}
                  </span>
                  <span style={{ textTransform: "capitalize" }}>{order.type}</span>
                  <span>{formatNumber(order.price)}</span>
                  <span>{formatNumber(order.quantity)}</span>
                  <span style={{ textTransform: "capitalize" }}>{order.status}</span>
                  <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  <button
                    type="button"
                    onClick={() => void handleCancelOrder(order.id)}
                    disabled={cancelingOrderId === order.id}
                    style={{
                      height: 26,
                      border: "1px solid rgba(248, 113, 113, 0.35)",
                      borderRadius: 7,
                      background: "rgba(127, 29, 29, 0.18)",
                      color: "#fca5a5",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {cancelingOrderId === order.id ? "..." : "Delete"}
                  </button>
                </Row>
              ))}
          </PanelGrid>
        )}

        {activeTab === "History" && (
          <PanelGrid columns="1.2fr 0.8fr 0.9fr 0.9fr 1fr">
            <GridHead labels={["Symbol", "Side", "Price", "Qty", "Time"]} />
            {loading && <EmptyRow columns={5}>Loading trades...</EmptyRow>}
            {!loading && trades.length === 0 && <EmptyRow columns={5}>No trade history yet.</EmptyRow>}
            {!loading &&
              trades.slice(0, 8).map((trade) => {
                const side = trade.buyerId === userId ? "buy" : "sell";

                return (
                  <Row key={trade.id} columns={5}>
                    <strong style={{ color: "#f4f4f5" }}>{trade.symbol}</strong>
                    <span style={{ color: side === "buy" ? "#22c55e" : "#ef4444", textTransform: "uppercase" }}>
                      {side}
                    </span>
                    <span>{formatNumber(trade.price)}</span>
                    <span>{formatNumber(trade.quantity)}</span>
                    <span>{new Date(trade.createdAt).toLocaleTimeString()}</span>
                  </Row>
                );
              })}
          </PanelGrid>
        )}

        {activeTab === "Position" && (
          <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#71717a", fontSize: 13 }}>
            No open positions.
          </div>
        )}

        {activeTab === "Balance" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(180px, 0.9fr) minmax(260px, 1fr)",
              gap: 12,
              alignItems: "stretch",
              minHeight: 86,
            }}
          >
            <div style={{ border: "1px solid var(--app-border, #20242d)", borderRadius: 8, padding: 12 }}>
              <span style={{ display: "block", color: "#71717a", fontSize: 12 }}>Wallet Balance</span>
              <strong style={{ display: "block", marginTop: 8, color: "#f4f4f5", fontSize: 20 }}>
                {loading ? "Loading..." : formatUsd(wallet?.balance || 0)}
              </strong>
            </div>
            <div style={{ border: "1px solid var(--app-border, #20242d)", borderRadius: 8, padding: 12 }}>
              <span style={{ display: "block", color: "#71717a", fontSize: 12 }}>Signed In Wallet</span>
              <strong style={{ display: "block", marginTop: 8, color: "#f4f4f5", fontSize: 13, wordBreak: "break-all" }}>
                {wallet?.email || "Login required"}
              </strong>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PanelGrid({ columns, children }: { columns: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: "8px 12px",
        alignItems: "center",
        color: "#a1a1aa",
        fontSize: 12,
      }}
    >
      {children}
    </div>
  );
}

function GridHead({ labels }: { labels: string[] }) {
  return labels.map((label) => (
    <strong key={label} style={{ color: "#71717a", fontSize: 11, textTransform: "uppercase" }}>
      {label}
    </strong>
  ));
}

function Row({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "contents",
        gridColumn: `span ${columns}`,
      }}
    >
      {children}
    </div>
  );
}

function EmptyRow({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <span style={{ gridColumn: `span ${columns}`, color: "#71717a", paddingTop: 8 }}>
      {children}
    </span>
  );
}
