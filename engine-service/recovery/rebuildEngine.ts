import { MarketManager } from "../market/MarketManager.js";
import { loadOpenOrders } from "./loadOrders.js";

export const rebuildEngine = async (
  marketManager: MarketManager
) => {
  const orders = await loadOpenOrders();

  console.log(`Rebuilding ${orders.length} orders...`);

  for (const order of orders) {
    marketManager.addOrderDirect(order);
  }

  console.log("Engine recovery complete");
};
