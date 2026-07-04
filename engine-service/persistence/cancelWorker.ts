import { db, type DbTransactionClient } from "../../packages/db/client.js";
import { parseMarketAssets } from "../../packages/utils/parseMarketAssets.js";
import { toNumber } from "../../packages/utils/decimal.js";
import { eventBus } from "../events/eventEmitter.js";
import { ORDER_CANCEL_EVENT, type OrderCancelEventPayload } from "../events/cancelEvents.js";
import { enqueueSettlement } from "./settlementQueue.js";

const CANCELLABLE_STATUSES = ["OPEN", "PARTIALLY_FILLED", "CANCEL_PENDING"] as const;
const isQuoteWalletAsset = (asset: string) => ["USDT", "USD", "DEV"].includes(asset);
let started = false;

const persistCancel = async (payload: OrderCancelEventPayload) => {
  await db.$transaction(async (tx: DbTransactionClient) => {
    const order = await tx.order.findUnique({
      where: { id: payload.orderId },
    });

    if (!order) return;
    if (order.status === "FILLED" || order.status === "CANCELLED") return;

    if (!CANCELLABLE_STATUSES.includes(order.status as (typeof CANCELLABLE_STATUSES)[number])) {
      return;
    }

    const { base, quote } = parseMarketAssets(order.symbol);
    const side = order.side.toLowerCase();
    const refundedQuote = toNumber(order.lockedQuote);
    const refundedBase = toNumber(order.lockedBase);

    const cancelled = await tx.order.updateMany({
      where: {
        id: order.id,
        status: {
          in: [...CANCELLABLE_STATUSES],
        },
      },
      data: {
        status: "CANCELLED",
        lockedQuote: 0,
        lockedBase: 0,
      },
    });

    if (cancelled.count !== 1) {
      throw new Error("Order changed before cancel settlement");
    }

    if (side === "buy" && refundedQuote > 0) {
      if (!isQuoteWalletAsset(quote)) {
        throw new Error(`Unsupported quote asset ${quote}`);
      }

      await tx.user.update({
        where: { id: order.userId },
        data: {
          balance: {
            increment: refundedQuote,
          },
        },
      });
    }

    if (side === "sell" && refundedBase > 0) {
      const assetRefund = await tx.assetBalance.updateMany({
        where: {
          userId: order.userId,
          asset: base,
          locked: {
            gte: refundedBase,
          },
        },
        data: {
          free: {
            increment: refundedBase,
          },
          locked: {
            decrement: refundedBase,
          },
        },
      });

      if (assetRefund.count !== 1) {
        throw new Error("Locked asset balance was insufficient for cancel refund");
      }
    }
  });
};

export const startCancelWorker = () => {
  if (started) return;
  started = true;

  eventBus.on<OrderCancelEventPayload>(ORDER_CANCEL_EVENT, ({ orderId, symbol, userId, removed, timestamp }) => {
    void enqueueSettlement(() => persistCancel({ orderId, symbol, userId, removed, timestamp })).catch((err) => {
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("Cancel persist error:", message);
    });
  });
};