import { getBalance } from "../stores/balanceStore.js";
import { createLock } from "../stores/orderLockStore.js";

/**
 * Validate + lock funds BEFORE matching
 */
export const validateAndLock = (order: {
  id: string; // ⚠️ REQUIRED for lock tracking
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  price?: number | null;
  quantity: number;
  type: "LIMIT" | "MARKET";
}): boolean => {
  const [base, quote] = order.symbol.split("-");

  if (!base || !quote) {
    console.error("❌ Invalid symbol format");
    return false;
  }

  // -------------------------
  // BUY SIDE
  // -------------------------
  if (order.side === "BUY") {
    const balance = getBalance(order.userId, quote);

    let required: number;

    /**
     * MARKET BUY → temporary worst-case lock
     * (we will improve later using orderbook simulation)
     */
    if (order.type === "MARKET") {
      required = order.quantity * 1_000_000; // temp cap
    } else {
      if (!order.price) {
        console.error("❌ LIMIT order missing price");
        return false;
      }
      required = order.price * order.quantity;
    }

    if (balance.free < required) {
      return false;
    }

    // lock funds
    balance.free -= required;
    balance.locked += required;

    // ✅ TRACK LOCK PER ORDER
    createLock(order.id, {
      userId: order.userId,
      base,
      quote,
      side: "BUY",
      lockedBase: 0,
      lockedQuote: required,
      remaining: order.quantity
    });

  } 
  // -------------------------
  // SELL SIDE
  // -------------------------
  else {
    const balance = getBalance(order.userId, base);

    if (balance.free < order.quantity) {
      return false;
    }

    // lock base asset
    balance.free -= order.quantity;
    balance.locked += order.quantity;

    // ✅ TRACK LOCK PER ORDER
    createLock(order.id, {
      userId: order.userId,
      base,
      quote,
      side: "SELL",
      lockedBase: order.quantity,
      lockedQuote: 0,
      remaining: order.quantity
    });
  }

  return true;
};
