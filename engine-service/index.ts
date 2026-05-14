import "./queue/redisConsumer.js";
import { startTradeWorker } from "./persistence/tradeWorker.js";
import { startOrderWorker } from "./persistence/orderWorker.js";
import "./events/tradePublisher.js";
import "./candles/candleStream.js";
import "./ws/wsServer.js";
import "./ws/orderbookStream.js";
import "./ws/tradeStream.js";
import { startConsumer } from "./queue/redisConsumer.js";

// recovery imports
import { marketManager } from "./market/MarketManager.js";
import { loadOpenOrders } from "./recovery/loadOrders.js";
import { rebuildLocks } from "./recovery/rebuildLocks.js";
import { rebuildEngine } from "./recovery/rebuildEngine.js";
import { rebuildSnapshots } from "./ws/snapshotRebuild.js";

void startConsumer();
void startTradeWorker();
startOrderWorker();

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
