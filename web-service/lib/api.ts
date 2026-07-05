import { getOrderEndpointPath, normalizeMarketApiSymbol, type MarketKind } from "@veltrix/config/markets";
import { clearAuthSession } from "@/auth/lib/auth";
import type { Wallet } from "@/wallet/stores/walletStore";
import type { Candle, CandleInterval, MarketSessionStats, OrderRow, TradeRow } from "@/trading/types/trading.types";
import type { TradeTapeItem } from "@/trading/lib/websocket";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export type OrderInput = {
  symbol: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
  type: "limit";
};

export type AuthResponse = {
  token: string;
  redirectTo?: string;
  user: {
    id: string;
    email: string;
    balance: number;
  };
};

export type OrderResponse = {
  success: boolean;
  orderId: string;
  message: string;
};

export type WalletResponse = {
  wallet: Wallet | null;
};

export type OpenOrdersResponse = {
  orders: OrderRow[];
};

export type TradeHistoryResponse = {
  trades: TradeRow[];
};

export type CandlesResponse = {
  candles: Candle[];
};

export type MarketStatsResponse = {
  stats: MarketSessionStats[];
};

export type MarketTradesResponse = {
  trades: TradeTapeItem[];
};

export type StripeCheckoutResponse = {
  url: string;
};

export type StripeConfirmResponse = {
  success: boolean;
  wallet: Wallet | null;
  credited: boolean;
};

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const isAuthTokenError = (res: Response, error: string) =>
  res.status === 401 && ["Invalid token", "No token"].includes(error);

const handleExpiredSession = () => {
  void clearAuthSession();

  if (typeof window === "undefined") {
    return;
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;

  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?expired=1&next=${encodeURIComponent(nextPath)}`;
  }
};

const parseJsonResponse = async <T>(res: Response, fallbackMessage: string): Promise<T> => {
  const text = await res.text();
  let data: Record<string, unknown> = {};

  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    const error = typeof data.error === "string" ? data.error : "";

    if (isAuthTokenError(res, error)) {
      handleExpiredSession();
      throw new Error("Session expired. Please log in again.");
    }

    throw new Error(error || fallbackMessage);
  }

  return data as T;
};

const authHeaders = (token?: string): Record<string, string> =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

const jsonHeaders = (token?: string): Record<string, string> => ({
  "Content-Type": "application/json",
  ...authHeaders(token),
});

/**
 * LOGIN USER
 */
export const loginUser = async (email: string, password: string, next?: string) => {
  try {
    const params = next
      ? `?${new URLSearchParams({ next }).toString()}`
      : "";
    const res = await fetch(`/api/auth/login${params}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, next }),
    });

    return parseJsonResponse<AuthResponse>(res, "Login failed");
  } catch (err) {
    throw new Error(getErrorMessage(err, "API unavailable. Make sure the API service is running."));
  }
};

export const registerUser = async (email: string, password: string) => {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    return parseJsonResponse<AuthResponse>(res, "Registration failed");
  } catch (err) {
    throw new Error(getErrorMessage(err, "API unavailable. Make sure the API service is running."));
  }
};

/**
 * PLACE ORDER
 */
export const placeOrder = async (
  order: OrderInput,
  token?: string,
  marketKind: MarketKind = "spot",
  apiSymbol = normalizeMarketApiSymbol(String(order.symbol || ""))
) => {
  const endpoint = getOrderEndpointPath(marketKind, { apiSymbol });
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders(token),
    body: JSON.stringify(order),
  });

  return parseJsonResponse<OrderResponse>(res, "Order failed");
};

export const getWallet = async (token?: string) => {
  const res = await fetch(`${API_URL}/wallet`, {
    credentials: "include",
    headers: authHeaders(token),
  });

  return parseJsonResponse<WalletResponse>(res, "Wallet failed");
};

export const getOpenOrders = async (token?: string) => {
  const res = await fetch(`${API_URL}/activity/orders/open`, {
    credentials: "include",
    headers: authHeaders(token),
  });

  return parseJsonResponse<OpenOrdersResponse>(res, "Orders failed");
};

export const cancelOrder = async (orderId: string, token?: string) => {
  const res = await fetch(`${API_URL}/order/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
    credentials: "include",
    headers: authHeaders(token),
  });

  return parseJsonResponse<OrderResponse>(res, "Cancel order failed");
};

export const getTradeHistory = async (token?: string) => {
  const res = await fetch(`${API_URL}/activity/trades/history`, {
    credentials: "include",
    headers: authHeaders(token),
  });

  return parseJsonResponse<TradeHistoryResponse>(res, "Trade history failed");
};

export const getMarketCandles = async (
  symbol: string,
  interval: CandleInterval,
  limit = 500
) => {
  const params = new URLSearchParams({
    interval,
    limit: String(limit),
  });
  const res = await fetch(`${API_URL}/market/${encodeURIComponent(symbol)}/candles?${params.toString()}`);

  return parseJsonResponse<CandlesResponse>(res, "Candles failed");
};

export const getMarketTrades = async (symbol: string, limit = 50) => {
  const params = new URLSearchParams({
    limit: String(limit),
  });
  const res = await fetch(`${API_URL}/market/${encodeURIComponent(symbol)}/trades?${params.toString()}`);

  return parseJsonResponse<MarketTradesResponse>(res, "Market trades failed");
};

export const getMarketStats = async (symbols: string[]) => {
  const params = new URLSearchParams({
    symbols: symbols.join(","),
  });
  const res = await fetch(`${API_URL}/market/stats?${params.toString()}`);

  return parseJsonResponse<MarketStatsResponse>(res, "Market stats failed");
};

export const createStripeCheckout = async (amountUsd: number, token?: string) => {
  const res = await fetch(`${API_URL}/payments/stripe/checkout`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders(token),
    body: JSON.stringify({ amountUsd }),
  });

  return parseJsonResponse<StripeCheckoutResponse>(res, "Payment failed");
};

export const confirmStripeCheckout = async (sessionId: string, token?: string) => {
  const res = await fetch(`${API_URL}/payments/stripe/confirm`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders(token),
    body: JSON.stringify({ sessionId }),
  });

  return parseJsonResponse<StripeConfirmResponse>(res, "Payment confirmation failed");
};
