import { startTradeWorker } from "./persistence/tradeWorker.js";
import { startOrderWorker } from "./persistence/orderWorker.js";
import { startCancelWorker } from "./persistence/cancelWorker.js";
import "./events/tradePublisher.js";
import "./candles/candleStream.js";
import "./ws/wsServer.js";
import "./ws/orderbookStream.js";
import "./ws/tradeStream.js";
import { startConsumer } from "./queue/redisConsumer.js";
import { marketManager } from "./market/MarketManager.js";
import { loadOpenOrders } from "./recovery/loadOrders.js";
import { rebuildLocks } from "./recovery/rebuildLocks.js";
import { rebuildEngine } from "./recovery/rebuildEngine.js";
import { startOpenOrderReconciler } from "./recovery/reconcileOpenOrders.js";
import { rebuildSnapshots } from "./ws/snapshotRebuild.js";

const start = async () => {
  void startTradeWorker();
  startOrderWorker();
  startCancelWorker();

  const orders = await loadOpenOrders();

  rebuildLocks(orders);

  await rebuildEngine(marketManager, orders);
  await rebuildSnapshots();
  await startConsumer();
  startOpenOrderReconciler();

  console.log("Engine ready after recovery");
};

void start();
