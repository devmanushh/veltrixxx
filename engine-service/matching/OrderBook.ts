import { RBTree } from "./RBTree.js";
import { PriceLevel } from "./PriceLevel.js";
import { Order } from "./Order.js";
import { eventBus } from "../events/eventEmitter.js";
import { ORDERBOOK_DIFF_EVENT } from "../events/orderbookEvents.js";

export class OrderBook {
  public symbol: string;

  private bids: RBTree<number, PriceLevel>;
  private asks: RBTree<number, PriceLevel>;

  /**
   * orderId → { level, side }
   */
  private orderIndex: Map<
    string,
    { level: PriceLevel; side: "BUY" | "SELL" }
  > = new Map();

  constructor(symbol: string) {
    this.symbol = symbol;

    // DESC for bids
    this.bids = new RBTree<number, PriceLevel>((a, b) => b - a);

    // ASC for asks
    this.asks = new RBTree<number, PriceLevel>((a, b) => a - b);
  }

  // ------------------------
  // ADD ORDER
  // ------------------------

  addOrder(order: Order) {
    if (order.side === "BUY") {
      this.addToTree(this.bids, order, "BUY");
    } else {
      this.addToTree(this.asks, order, "SELL");
    }
  }

  private addToTree(
    tree: RBTree<number, PriceLevel>,
    order: Order,
    side: "BUY" | "SELL"
  ) {
    const price = order.price!;

    let level = tree.find(price);

    if (!level) {
      level = new PriceLevel(price);
      tree.insert(price, level);
    }

    level.add(order);

    // index with side
    this.orderIndex.set(order.id, { level, side });

    // ✅ emit AFTER state change
    this.emitLevelUpdate(side, level);
  }

  // ------------------------
  // REMOVE ORDER (CANCEL)
  // ------------------------

  removeOrder(orderId: string): boolean {
    const entry = this.orderIndex.get(orderId);
    if (!entry) return false;

    const { level, side } = entry;

    const removed = level.remove(orderId);

    if (removed) {
      this.orderIndex.delete(orderId);

      // ✅ emit correct diff
      this.emitLevelUpdate(side, level);

      if (level.isEmpty()) {
        const tree = side === "BUY" ? this.bids : this.asks;
        tree.delete(level.price);
      }
    }

    return removed;
  }

  hasOrder(orderId: string): boolean {
    return this.orderIndex.has(orderId);
  }

  emitOrderUpdate(orderId: string) {
    const entry = this.orderIndex.get(orderId);

    if (entry) {
      this.emitLevelUpdate(entry.side, entry.level);
    }
  }

  // ------------------------
  // BEST PRICES
  // ------------------------

  getBestBid(): PriceLevel | null {
    return this.bids.getMin(); // DESC tree
  }

  getBestAsk(): PriceLevel | null {
    return this.asks.getMin(); // ASC tree
  }

  // ------------------------
  // POP BEST (MATCHING)
  // ------------------------

  popBestBid(): Order | null {
    const level = this.getBestBid();
    if (!level) return null;

    const order = level.shift();

    if (order) {
      this.orderIndex.delete(order.id);

      // ✅ emit diff after match
      this.emitLevelUpdate("BUY", level);

      if (level.isEmpty()) {
        this.bids.delete(level.price);
      }
    }

    return order;
  }

  popBestAsk(): Order | null {
    const level = this.getBestAsk();
    if (!level) return null;

    const order = level.shift();

    if (order) {
      this.orderIndex.delete(order.id);

      // ✅ emit diff after match
      this.emitLevelUpdate("SELL", level);

      if (level.isEmpty()) {
        this.asks.delete(level.price);
      }
    }

    return order;
  }

  // ------------------------
  // PEEK
  // ------------------------

  peekBestBid(): Order | null {
    return this.getBestBid()?.peek() || null;
  }

  peekBestAsk(): Order | null {
    return this.getBestAsk()?.peek() || null;
  }

  // ------------------------
  // DIFF EMISSION (CORE FIX)
  // ------------------------

  private emitLevelUpdate(
    side: "BUY" | "SELL",
    level: PriceLevel
  ) {
    const quantity = level.isEmpty() ? 0 : level.getTotalRemaining();

    eventBus.emit(ORDERBOOK_DIFF_EVENT, {
      symbol: this.symbol,
      side,
      price: level.price,
      quantity
    });
  }
}
