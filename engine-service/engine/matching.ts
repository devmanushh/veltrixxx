import { Order } from "./Order.js";
import { Trade } from "./Trade.js";
import { OrderBook } from "./OrderBook.js";

let tradeSequence = 0;

const nextTradeId = () => {
  tradeSequence = (tradeSequence + 1) % 1000;
  return Date.now() * 1000 + tradeSequence;
};

export class MatchingEngine {
  private orderBook: OrderBook;

  constructor(orderBook: OrderBook) {
    this.orderBook = orderBook;
  }

  process(order: Order): {
    trades: Trade[];
    remainingOrder: Order | null;
  } {
    const trades: Trade[] = [];

    // ------------------------
    // POST ONLY CHECK
    // ------------------------
    if (order.type === "POST_ONLY") {
      const bestOpp =
        order.side === "BUY"
          ? this.orderBook.peekBestAsk()
          : this.orderBook.peekBestBid();

      if (
        bestOpp &&
        ((order.side === "BUY" && order.price! >= bestOpp.price!) ||
          (order.side === "SELL" && order.price! <= bestOpp.price!))
      ) {
        // reject immediately
        return { trades: [], remainingOrder: null };
      }
    }

    // ------------------------
    // FOK CHECK (pre-validation)
    // ------------------------
    if (order.type === "FOK") {
      const canFill = this.canFullyFill(order);
      if (!canFill) {
        return { trades: [], remainingOrder: null };
      }
    }

    // ------------------------
    // MATCHING
    // ------------------------
    if (order.side === "BUY") {
      this.matchBuy(order, trades);
    } else {
      this.matchSell(order, trades);
    }

    // ------------------------
    // IOC HANDLING
    // ------------------------
    if (order.type === "IOC") {
      return { trades, remainingOrder: null };
    }

    // ------------------------
    // ADD TO BOOK (LIMIT ONLY)
    // ------------------------
    if (order.remaining > 0 && order.type === "LIMIT") {
      this.orderBook.addOrder(order);
      return { trades, remainingOrder: order };
    }

    return { trades, remainingOrder: null };
  }

  // ------------------------
  // BUY MATCHING
  // ------------------------

  private matchBuy(taker: Order, trades: Trade[]) {
    while (taker.remaining > 0) {
      const bestAsk = this.orderBook.peekBestAsk();
      if (!bestAsk) break;

      // LIMIT price check
      if (
        taker.type !== "MARKET" &&
        taker.price! < bestAsk.price!
      ) {
        break;
      }

      const maker = bestAsk;

      const tradeQty = Math.min(taker.remaining, maker.remaining);

      // MAKER PRICE RULE
      const tradePrice = maker.price!;

      taker.fill(tradeQty);
      maker.fill(tradeQty);

      const trade = new Trade({
        id: nextTradeId(),
        symbol: taker.symbol,
        price: tradePrice,
        quantity: tradeQty,
        buyerId: taker.userId,
        sellerId: maker.userId,
        buyOrderId: taker.id,
        sellOrderId: maker.id,
        buyOrderDbId: taker.dbId,
        sellOrderDbId: maker.dbId,
        buyOrderRemaining: taker.remaining,
        sellOrderRemaining: maker.remaining,
        timestamp: Date.now()
      });

      trades.push(trade);

      // remove maker if filled
      if (maker.isFilled()) {
        this.orderBook.popBestAsk();
      }
    }
  }

  // ------------------------
  // SELL MATCHING
  // ------------------------

  private matchSell(taker: Order, trades: Trade[]) {
    while (taker.remaining > 0) {
      const bestBid = this.orderBook.peekBestBid();
      if (!bestBid) break;

      if (
        taker.type !== "MARKET" &&
        taker.price! > bestBid.price!
      ) {
        break;
      }

      const maker = bestBid;

      const tradeQty = Math.min(taker.remaining, maker.remaining);

      // MAKER PRICE RULE
      const tradePrice = maker.price!;

      taker.fill(tradeQty);
      maker.fill(tradeQty);

      const trade = new Trade({
        id: nextTradeId(),
        symbol: taker.symbol,
        price: tradePrice,
        quantity: tradeQty,
        buyerId: maker.userId,
        sellerId: taker.userId,
        buyOrderId: maker.id,
        sellOrderId: taker.id,
        buyOrderDbId: maker.dbId,
        sellOrderDbId: taker.dbId,
        buyOrderRemaining: maker.remaining,
        sellOrderRemaining: taker.remaining,
        timestamp: Date.now()
      });

      trades.push(trade);

      if (maker.isFilled()) {
        this.orderBook.popBestBid();
      }
    }
  }

  // ------------------------
  // FOK HELPER
  // ------------------------

  private canFullyFill(order: Order): boolean {
    let remaining = order.quantity;

    if (order.side === "BUY") {
      const level = this.orderBook.getBestAsk();

      if (!level) return false;

      for (const o of level) {
        if (
          order.type !== "MARKET" &&
          order.price! < o.price!
        ) {
          return false;
        }

        remaining -= o.remaining;
        if (remaining <= 0) return true;
      }
    } else {
      const level = this.orderBook.getBestBid();

      if (!level) return false;

      for (const o of level) {
        if (
          order.type !== "MARKET" &&
          order.price! > o.price!
        ) {
          return false;
        }

        remaining -= o.remaining;
        if (remaining <= 0) return true;
      }
    }

    return remaining <= 0;
  }
}
