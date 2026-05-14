"use client";

import { create } from "zustand";
import { getWallet } from "@/lib/api";

export type Wallet = {
  id: string;
  email: string;
  balance: number;
  assetBalances?: Array<{
    asset: string;
    free: number;
    locked: number;
  }>;
};

type WalletState = {
  wallet: Wallet | null;
  loading: boolean;
  error: string;
  loadWallet: () => Promise<void>;
  setWallet: (wallet: Wallet | null) => void;
  resetWallet: () => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  loading: true,
  error: "",
  loadWallet: async () => {
    try {
      set({ loading: true, error: "" });
      const token = localStorage.getItem("token") || "";

      if (!token) {
        set({ wallet: null, loading: false, error: "Login required" });
        return;
      }

      const data = await getWallet(token);
      set({ wallet: data.wallet || null, loading: false });
    } catch (err) {
      set({
        wallet: null,
        loading: false,
        error: err instanceof Error ? err.message : "Wallet failed",
      });
    }
  },
  setWallet: (wallet) => set({ wallet, loading: false, error: "" }),
  resetWallet: () => set({ wallet: null, loading: false, error: "" }),
}));
