"use client";

import {
  getDefaultMarket,
  getMarketBySymbol,
  type MarketConfig,
  type MarketKind,
} from "@veltrix/config/markets";
import { create } from "zustand";

type MarketState = {
  selectedSymbols: Record<MarketKind, string>;
  setSelectedSymbol: (kind: MarketKind, symbol: string) => void;
  getSelectedMarket: (kind: MarketKind) => MarketConfig;
};

export const useMarketStore = create<MarketState>((set, get) => ({
  selectedSymbols: {
    spot: getDefaultMarket("spot").symbol,
    futures: getDefaultMarket("futures").symbol,
  },
  setSelectedSymbol: (kind, symbol) =>
    set((state) => ({
      selectedSymbols: {
        ...state.selectedSymbols,
        [kind]: getMarketBySymbol(kind, symbol).symbol,
      },
    })),
  getSelectedMarket: (kind) => getMarketBySymbol(kind, get().selectedSymbols[kind]),
}));

export const useSelectedMarket = (kind: MarketKind) =>
  useMarketStore((state) => getMarketBySymbol(kind, state.selectedSymbols[kind]));
