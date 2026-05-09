import { processOrder } from "./queue/consumer.js";
import { Order } from "./engine/Order.js";
import "./queue/redisConsumer.js";
import { startTradeWorker } from "./persistence/tradeWorker.js";
import "./events/tradePublisher.js";
import "./candles/candleStream.js";
import "./ws/wsServer.js";
import "./ws/orderbookStream.js";
import { startConsumer } from "./queue/redisConsumer.js";

// recovery imports
import { marketManager } from "./market/MarketManager.js";
import { loadOpenOrders } from "./recovery/loadOrders.js";
import { rebuildLocks } from "./recovery/rebuildLocks.js";
import { rebuildEngine } from "./recovery/rebuildEngine.js";
import { rebuildSnapshots } from "./ws/snapshotRebuild.js";

void startConsumer();
void startTradeWorker();

const start = async () => {
  // 1. Load orders from DB
  const orders = await loadOpenOrders();

  // 2. Rebuild locks (VERY IMPORTANT)
  rebuildLocks(orders);

  // 3. Rebuild orderbook WITHOUT matching
  await rebuildEngine(marketManager);
  await rebuildSnapshots();

  console.log("🚀 Engine ready after recovery");
};

start();

if (process.env.ENABLE_ENGINE_SIMULATION === "true") {
  setInterval(() => {
    const order = new Order({
      id: Date.now(),
      userId: "system",
      symbol: "BTCUSDT",
      price: Math.random() > 0.5 ? 101 : 100,
      quantity: 1,
      side: Math.random() > 0.5 ? "BUY" : "SELL",
      type: "LIMIT",
      timestamp: Date.now(),
    });

    console.log("Incoming simulated order:", order);

    processOrder(order);
  }, 1000);
}
