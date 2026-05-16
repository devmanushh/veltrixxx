import { createLock } from "../store/orderLockStore.js";
import { parseMarketAssets } from "../../packages/utils/parseMarketAssets.js";
import type { Order } from "../engine/Order.js";

export const rebuildLocks = (orders: Order[]) => {
  for (const o of orders) {
    const { base, quote } = parseMarketAssets(o.symbol);

    if (o.side === "BUY") {
      if (o.price === null) {
        continue;
      }

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
