"use client";

import { create } from "zustand";
import { cancelOrder, getOpenOrders, getTradeHistory } from "@/lib/api";
import { useWalletStore } from "@/stores/walletStore";

export type OrderRow = {
  id: string;
  symbol: string;
  price: number | null;
  quantity: number;
  side: string;
  type: string;
  status: string;
  createdAt: string;
};

export type TradeRow = {
  id: string;
  buyerId: string;
  sellerId: string;
  symbol: string;
  price: number;
  quantity: number;
  createdAt: string;
};

type ActivityState = {
  orders: OrderRow[];
  trades: TradeRow[];
  userId: string;
  loading: boolean;
  error: string;
  cancelingOrderId: string;
  loadActivity: () => Promise<void>;
  cancelOrderById: (orderId: string) => Promise<void>;
};

const readUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return typeof user.id === "string" ? user.id : "";
  } catch {
    return "";
  }
};

export const useActivityStore = create<ActivityState>((set, get) => ({
  orders: [],
  trades: [],
  userId: "",
  loading: true,
  error: "",
  cancelingOrderId: "",
  loadActivity: async () => {
    try {
      set({ loading: true, error: "", userId: readUserId() });
      const token = localStorage.getItem("token") || "";

      if (!token) {
        set({
          orders: [],
          trades: [],
          loading: false,
          error: "Login to view trading activity.",
        });
        return;
      }

      const [ordersResult, tradesResult] = await Promise.all([
        getOpenOrders(token),
        getTradeHistory(token),
      ]);

      set({
        orders: ordersResult.orders || [],
        trades: tradesResult.trades || [],
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Trading activity failed",
      });
    }
  },
  cancelOrderById: async (orderId) => {
    try {
      set({ cancelingOrderId: orderId, error: "" });
      const token = localStorage.getItem("token") || "";
      await cancelOrder(token, orderId);
      set({
        orders: get().orders.filter((order) => order.id !== orderId),
        cancelingOrderId: "",
      });
      await useWalletStore.getState().loadWallet();
      window.dispatchEvent(new Event("veltrix:orders-updated"));
    } catch (err) {
      set({
        cancelingOrderId: "",
        error: err instanceof Error ? err.message : "Cancel order failed",
      });
      throw err;
    }
  },
}));
