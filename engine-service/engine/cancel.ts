import { getLock, removeLock } from "../store/orderLockStore.js";
import { getBalance } from "../store/balanceStore.js";

export const cancelOrderAndRefund = (orderId: number) => {
  const lock = getLock(orderId);
  if (!lock) return false;

  const { userId, base, quote, side, lockedBase, lockedQuote } = lock;

  if (side === "BUY") {
    const bal = getBalance(userId, quote);

    bal.locked -= lockedQuote;
    bal.free += lockedQuote;

  } else {
    const bal = getBalance(userId, base);

    bal.locked -= lockedBase;
    bal.free += lockedBase;
  }

  removeLock(orderId);

  return true;
};