import { eventBus } from "../events/eventEmitter.js";
import {
  ORDERBOOK_DIFF_EVENT,
  OrderbookDiffPayload
} from "../events/orderbookEvents.js";
import { broadcast } from "./wsServer.js";
import { getSnapshot } from "./snapshotCache.js";
import { nextSeq } from "./sequence.js";

eventBus.on<OrderbookDiffPayload>(
  ORDERBOOK_DIFF_EVENT,
  async (diff) => {
    const snapshot = getSnapshot(diff.symbol);
    const seq = nextSeq(diff.symbol);

    const sideMap =
      diff.side === "BUY" ? snapshot.bids : snapshot.asks;

    if (diff.quantity === 0) {
      sideMap.delete(diff.price);
    } else {
      sideMap.set(diff.price, diff.quantity);
    }

    broadcast(diff.symbol, {
      type: "ORDERBOOK_DIFF",
      seq,
      data: diff
    });
  }
);