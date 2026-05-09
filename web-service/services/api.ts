import { getOrderEndpointPath, normalizeMarketApiSymbol, type MarketKind } from "@veltrix/config/markets";
import { clearAuthSession } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const isAuthTokenError = (res: Response, error: string) =>
  res.status === 401 && ["Invalid token", "No token"].includes(error);

const handleExpiredSession = () => {
  clearAuthSession();

  if (typeof window === "undefined") {
    return;
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;

  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?expired=1&next=${encodeURIComponent(nextPath)}`;
  }
};

const parseJsonResponse = async (res: Response, fallbackMessage: string) => {
  const text = await res.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    if (isAuthTokenError(res, data.error || "")) {
      handleExpiredSession();
      throw new Error("Session expired. Please log in again.");
    }

    throw new Error(data.error || fallbackMessage);
  }

  return data;
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

/**
 * LOGIN USER
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    return parseJsonResponse(res, "Login failed");
  } catch (err: any) {
    throw new Error(err.message || "API unavailable. Make sure the API service is running.");
  }
};

export const registerUser = async (email: string, password: string) => {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    return parseJsonResponse(res, "Registration failed");
  } catch (err: any) {
    throw new Error(err.message || "API unavailable. Make sure the API service is running.");
  }
};

/**
 * PLACE ORDER
 */
export const placeOrder = async (
  order: any,
  token: string,
  marketKind: MarketKind = "spot",
  apiSymbol = normalizeMarketApiSymbol(String(order.symbol || ""))
) => {
  const endpoint = getOrderEndpointPath(marketKind, { apiSymbol });
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(order),
  });

  return parseJsonResponse(res, "Order failed");
};

export const getWallet = async (token: string) => {
  const res = await fetch(`${API_URL}/wallet`, {
    headers: authHeaders(token),
  });

  return parseJsonResponse(res, "Wallet failed");
};

export const getOpenOrders = async (token: string) => {
  const res = await fetch(`${API_URL}/activity/orders/open`, {
    headers: authHeaders(token),
  });

  return parseJsonResponse(res, "Orders failed");
};

export const cancelOrder = async (token: string, orderId: string) => {
  const res = await fetch(`${API_URL}/order/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  return parseJsonResponse(res, "Cancel order failed");
};

export const getTradeHistory = async (token: string) => {
  const res = await fetch(`${API_URL}/activity/trades/history`, {
    headers: authHeaders(token),
  });

  return parseJsonResponse(res, "Trade history failed");
};

export const createStripeCheckout = async (token: string, amountUsd: number) => {
  const res = await fetch(`${API_URL}/payments/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ amountUsd }),
  });

  return parseJsonResponse(res, "Payment failed");
};

export const confirmStripeCheckout = async (token: string, sessionId: string) => {
  const res = await fetch(`${API_URL}/payments/stripe/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ sessionId }),
  });

  return parseJsonResponse(res, "Payment confirmation failed");
};
