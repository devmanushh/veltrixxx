import { MarketManager } from "../market/MarketManager.js";
import { loadOpenOrders } from "./loadOrders.js";
import type { Order } from "../matching/Order.js";

export const rebuildEngine = async (
  marketManager: MarketManager,
  orders?: Order[]
) => {
  const openOrders = orders ?? await loadOpenOrders();

  console.log(`Rebuilding ${openOrders.length} orders...`);

  for (const order of openOrders) {
    marketManager.addOrderDirect(order);
  }

  console.log("Engine recovery complete");
};
