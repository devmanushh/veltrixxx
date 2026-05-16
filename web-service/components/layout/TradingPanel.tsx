"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActivityStore } from "@/stores/activityStore";
import { useWalletStore } from "@/stores/walletStore";

const tabs = ["Orders", "History", "Position", "Balance"] as const;

type Tab = (typeof tabs)[number];

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

export default function TradingPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Orders");
  const orders = useActivityStore((state) => state.orders);
  const trades = useActivityStore((state) => state.trades);
  const userId = useActivityStore((state) => state.userId);
  const loading = useActivityStore((state) => state.loading);
  const error = useActivityStore((state) => state.error);
  const cancelingOrderId = useActivityStore((state) => state.cancelingOrderId);
  const loadActivity = useActivityStore((state) => state.loadActivity);
  const cancelOrderById = useActivityStore((state) => state.cancelOrderById);
  const wallet = useWalletStore((state) => state.wallet);
  const walletLoading = useWalletStore((state) => state.loading);
  const loadWallet = useWalletStore((state) => state.loadWallet);

  useEffect(() => {
    void Promise.all([loadActivity(), loadWallet()]);

    const onOrdersUpdated = () => {
      void Promise.all([loadActivity(), loadWallet()]);
    };

    window.addEventListener("veltrix:orders-updated", onOrdersUpdated);
    window.addEventListener("veltrix:wallet-updated", onOrdersUpdated);

    return () => {
      window.removeEventListener("veltrix:orders-updated", onOrdersUpdated);
      window.removeEventListener("veltrix:wallet-updated", onOrdersUpdated);
    };
  }, [loadActivity, loadWallet]);

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
    <section
      className="exchange-panel trading-panel"
    >
      <div className="trading-panel-header">
        <div className="trading-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "tab-button tab-button-active" : "tab-button"}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void Promise.all([loadActivity(), loadWallet()])}
          disabled={loading}
          title="Refresh"
          className="ghost-button"
        >
          {loading ? "Loading" : "Refresh"}
        </button>
      </div>

      <div className="trading-panel-body">
        {error && (
          <div className={error.includes("Login") ? "text-muted" : "text-danger"}>
            {error}
          </div>
        )}

        {activeTab === "Orders" && (
          <PanelGrid className="panel-grid-orders">
            <GridHead labels={["Symbol", "Side", "Type", "Price", "Qty", "Status", "Time", "Action"]} />
            {loading && <EmptyRow columns={8}>Loading orders...</EmptyRow>}
            {!loading && orders.length === 0 && <EmptyRow columns={8}>No pending orders.</EmptyRow>}
            {!loading &&
              orders.slice(0, 8).map((order) => (
                <Row key={order.id} columns={8}>
                  <strong className="text-strong">{order.symbol}</strong>
                  <span className={order.side === "buy" ? "market-green" : "market-red"}>
                    {order.side}
                  </span>
                  <span>{order.type}</span>
                  <span className="market-num">{formatNumber(order.price)}</span>
                  <span className="market-num">{formatNumber(order.quantity)}</span>
                  <span>{order.status}</span>
                  <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  <button
                    type="button"
                    onClick={() => void handleCancelOrder(order.id)}
                    disabled={cancelingOrderId === order.id}
                    className="danger-button"
                  >
                    {cancelingOrderId === order.id ? "..." : "Delete"}
                  </button>
                </Row>
              ))}
          </PanelGrid>
        )}

        {activeTab === "History" && (
          <PanelGrid className="panel-grid-history">
            <GridHead labels={["Symbol", "Side", "Price", "Qty", "Time"]} />
            {loading && <EmptyRow columns={5}>Loading trades...</EmptyRow>}
            {!loading && trades.length === 0 && <EmptyRow columns={5}>No trade history yet.</EmptyRow>}
            {!loading &&
              trades.slice(0, 8).map((trade) => {
                const side = trade.buyerId === userId ? "buy" : "sell";

                return (
                  <Row key={trade.id} columns={5}>
                    <strong className="text-strong">{trade.symbol}</strong>
                    <span className={side === "buy" ? "market-green" : "market-red"}>
                      {side}
                    </span>
                    <span className="market-num">{formatNumber(trade.price)}</span>
                    <span className="market-num">{formatNumber(trade.quantity)}</span>
                    <span>{new Date(trade.createdAt).toLocaleTimeString()}</span>
                  </Row>
                );
              })}
          </PanelGrid>
        )}

        {activeTab === "Position" && (
          <div className="stack-center">
            No open positions.
          </div>
        )}

        {activeTab === "Balance" && (
          <div className="panel-grid-wallet">
            <div className="glass-panel metric-card">
              <span className="stat-label">Wallet Balance</span>
              <strong className="market-price">
                {walletLoading ? "Loading..." : formatUsd(wallet?.balance || 0)}
              </strong>
            </div>
            <div className="glass-panel metric-card">
              <span className="stat-label">Signed In Wallet</span>
              <strong className="text-strong word-break">
                {wallet?.email || "Login required"}
              </strong>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PanelGrid({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`panel-grid ${className}`}>
      {children}
    </div>
  );
}

function GridHead({ labels }: { labels: string[] }) {
  return labels.map((label) => (
    <strong key={label} className="table-head">
      {label}
    </strong>
  ));
}

function Row(props: { columns: number; children: React.ReactNode }) {
  return (
    <div
      className="grid-row"
    >
      {props.children}
    </div>
  );
}

function EmptyRow({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <span className={columns === 8 ? "empty-row-8 text-dim" : "empty-row-5 text-dim"}>
      {children}
    </span>
  );
}
