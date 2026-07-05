import { Market } from "./Market.js";
import { Order } from "../matching/Order.js";
import { Trade } from "../matching/Trade.js";

export class MarketManager {
  private markets: Map<string, Market> = new Map();

  /**
   * Get or create market
   */
  private getMarket(symbol: string): Market {
    let market = this.markets.get(symbol);

    if (!market) {
      market = new Market(symbol);
      this.markets.set(symbol, market);
      console.log(`Market created: ${symbol}`);
    }

    return market;
  }

  /**
   * Process incoming order
   */
  async process(order: Order): Promise<{
    trades: Trade[];
    remainingOrder: Order | null;
  }> {
    const market = this.getMarket(order.symbol);

    return market.processOrder(order);
  }

  /**
   * Cancel order
   */
  cancel(symbol: string, orderId: string): boolean {
    const market = this.markets.get(symbol);
    if (!market) return false;

    return market.cancelOrder(orderId);
  }

  hasOrder(symbol: string, orderId: string): boolean {
    return this.markets.get(symbol)?.hasOrder(orderId) ?? false;
  }

  /**
   * Debug / future use
   */
  getMarketSnapshot(symbol: string) {
    return this.markets.get(symbol)?.getOrderBook();
  }

  addOrderDirect(order: Order) {
  const market = this.getMarket(order.symbol);
  market.addOrderDirect(order);
}

}

export const marketManager = new MarketManager();
