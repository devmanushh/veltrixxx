import { createLock } from "../store/orderLockStore.js";
import { parseMarketAssets } from "../market/symbol.js";

export const rebuildLocks = (orders: any[]) => {
  for (const o of orders) {
    const { base, quote } = parseMarketAssets(o.symbol);

    if (o.side === "BUY") {
      createLock(o.id, {
        userId: o.userId,
        base,
        quote,
        side: "BUY",
        lockedBase: 0,
        lockedQuote: o.price * o.remaining,
        remaining: o.remaining
      });
    } else {
      createLock(o.id, {
        userId: o.userId,
        base,
        quote,
        side: "SELL",
        lockedBase: o.remaining,
        lockedQuote: 0,
        remaining: o.remaining
      });
    }
  }
};
