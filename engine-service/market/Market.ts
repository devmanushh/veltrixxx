import { cancelOrderAndRefund } from "../engine/cancel.js";
import { Order } from "../engine/Order.js";
import { OrderBook } from "../engine/OrderBook.js";
import { settleTrade } from "../engine/settlement.js";
import { MatchingEngine } from "../engine/matching.js";
import { eventBus } from "../events/eventEmitter.js";
import { TRADE_EVENT } from "../events/tradeEvents.js";
import { ORDER_EVENT } from "../events/orderEvents.js";
import { getBalance } from "../store/balanceStore.js";
import { parseMarketAssets } from "./symbol.js";

export class Market {
  public symbol: string;

  private orderBook: OrderBook;
  private matcher: MatchingEngine;

  constructor(symbol: string) {
    this.symbol = symbol;

    this.orderBook = new OrderBook(symbol);
    this.matcher = new MatchingEngine(this.orderBook);
  }

  processOrder(order: Order) {
    const result = this.matcher.process(order);

    // -------------------------
    // ✅ APPLY SETTLEMENT
    // -------------------------
    for (const trade of result.trades) {
      settleTrade(trade);
    }

    // -------------------------
    // 🔥 STEP 3 — SAFE REFUND LOGIC
    // -------------------------
    if (order.side === "BUY" && order.type === "LIMIT") {
      const { quote } = parseMarketAssets(this.symbol);
      const balance = getBalance(order.userId, quote);

      /**
       * Total originally locked
       */
      const initialLocked = (order.price || 0) * order.quantity;

      /**
       * Actual spent via trades
       */
      let spent = 0;
      for (const trade of result.trades) {
        if (trade.buyerId === order.userId) {
          spent += trade.price * trade.quantity;
        }
      }

      /**
       * Refund remaining
       */
      const refund = initialLocked - spent;

      if (refund > 0) {
        balance.locked -= refund;
        balance.free += refund;
      }
    }

    // -------------------------
    // 📡 EMIT EVENTS
    // -------------------------
    for (const trade of result.trades) {
      eventBus.emit(TRADE_EVENT, { trade });
    }

    eventBus.emit(ORDER_EVENT, { order });

    return result;
  }


cancelOrder(orderId: number): boolean {
  const removed = this.orderBook.removeOrder(orderId);

  if (!removed) return false;

  cancelOrderAndRefund(orderId);

  return true;
}

  getOrderBook() {
    return this.orderBook;
  }


  addOrderDirect(order: Order) {
  this.orderBook.addOrder(order);
}

}
