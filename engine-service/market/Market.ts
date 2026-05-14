import { Order } from "../engine/Order.js";
import { OrderBook } from "../engine/OrderBook.js";
import { MatchingEngine } from "../engine/matching.js";
import { eventBus } from "../events/eventEmitter.js";
import { ORDER_EVENT } from "../events/orderEvents.js";
import { TRADE_EVENT } from "../events/tradeEvents.js";

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

    for (const trade of result.trades) {
      eventBus.emit(TRADE_EVENT, { trade });
    }

    eventBus.emit(ORDER_EVENT, { order });

    return result;
  }

  cancelOrder(orderId: number): boolean {
    return this.orderBook.removeOrder(orderId);
  }

  getOrderBook() {
    return this.orderBook;
  }

  addOrderDirect(order: Order) {
    this.orderBook.addOrder(order);
  }
}
