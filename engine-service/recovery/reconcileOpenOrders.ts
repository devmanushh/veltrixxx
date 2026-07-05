import { marketManager } from "../market/MarketManager.js";
import { loadOpenOrders } from "./loadOrders.js";

const DEFAULT_RECONCILE_MS = 5_000;
const DEFAULT_RECONCILE_GRACE_MS = 30_000;

let running = false;
let started = false;

const getReconcileIntervalMs = () => {
  const configured = Number(process.env.ORDER_RECONCILE_MS);

  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_RECONCILE_MS;
  }

  return configured;
};
const getReconcileGraceMs = () => {
  const configured = Number(process.env.ORDER_RECONCILE_GRACE_MS);

  if (!Number.isFinite(configured) || configured < 0) {
    return DEFAULT_RECONCILE_GRACE_MS;
  }

  return configured;
};

export const reconcileOpenOrders = async () => {
  if (running) return;

  running = true;

  try {
    const orders = await loadOpenOrders({ olderThanMs: getReconcileGraceMs() });
    let recovered = 0;

    for (const order of orders) {
      if (marketManager.hasOrder(order.symbol, order.id)) {
        continue;
      }

      marketManager.addOrderDirect(order);
      recovered++;
    }

    if (recovered > 0) {
      console.warn(`Recovered ${recovered} persisted open order(s) into the engine book`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("Open order reconciliation failed:", message);
  } finally {
    running = false;
  }
};

export const startOpenOrderReconciler = () => {
  if (started) return;
  started = true;

  void reconcileOpenOrders();

  const timer = setInterval(() => {
    void reconcileOpenOrders();
  }, getReconcileIntervalMs());

  timer.unref?.();
};