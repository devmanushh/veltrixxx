import { enqueueCancelOrderCommand, enqueuePlaceOrderCommand } from "./order.producer.js";
import { db, type DbTransactionClient } from "../../packages/db/client.js";
import { ValidationError } from "../../packages/errors/index.js";
import type { Order } from "../../packages/types/index.js";
import { parseMarketAssets } from "../../packages/utils/parseMarketAssets.js";
import { toDecimalString, toNumber } from "../../packages/utils/decimal.js";

const ACTIVE_ORDER_STATUSES = ["OPEN", "PARTIALLY_FILLED"] as const;
const isQuoteWalletAsset = (asset: string) => ["USDT", "USD", "DEV"].includes(asset);

export const placeOrderService = async (order: Order) => {
  if (order.type !== "limit") {
    throw new ValidationError("Market orders require a live price source before they can be enabled");
  }

  const orderPrice = toDecimalString(order.price ?? 0);
  const orderQuantity = toDecimalString(order.quantity);
  const orderValue = toDecimalString(toNumber(orderPrice) * toNumber(orderQuantity));

  if (toNumber(orderValue) <= 0) {
    throw new ValidationError("Order value must be greater than 0");
  }

  await db.$transaction(async (tx: DbTransactionClient) => {
    const { base, quote } = parseMarketAssets(order.symbol);

    if (order.side === "buy") {
      if (!isQuoteWalletAsset(quote)) {
        throw new ValidationError(`Unsupported quote asset ${quote}`);
      }

      const walletDebit = await tx.user.updateMany({
        where: {
          id: order.userId,
          balance: {
            gte: orderValue,
          },
        },
        data: {
          balance: {
            decrement: orderValue,
          },
        },
      });

      if (walletDebit.count !== 1) {
        throw new ValidationError("Insufficient wallet balance");
      }
    } else {
      const assetLock = await tx.assetBalance.updateMany({
        where: {
          userId: order.userId,
          asset: base,
          free: {
            gte: orderQuantity,
          },
        },
        data: {
          free: {
            decrement: orderQuantity,
          },
          locked: {
            increment: orderQuantity,
          },
        },
      });

      if (assetLock.count !== 1) {
        throw new ValidationError(`Insufficient ${base} balance`);
      }
    }

    await tx.order.create({
      data: {
        id: order.id,
        userId: order.userId,
        symbol: order.symbol,
        price: order.price === null || order.price === undefined ? null : orderPrice,
        quantity: orderQuantity,
        remaining: orderQuantity,
        lockedQuote: order.side === "buy" ? orderValue : 0,
        lockedBase: order.side === "sell" ? orderQuantity : 0,
        side: order.side,
        type: order.type,
        status: "OPEN",
      },
    });

    await enqueuePlaceOrderCommand(tx, order);
  });

  return {
    success: true,
    message: "Order accepted",
  };
};

export const cancelOrderService = async (input: {
  orderId: string;
  userId: string;
}) => {
  return db.$transaction(async (tx: DbTransactionClient) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order || order.userId !== input.userId) {
      throw new ValidationError("Order not found");
    }

    if (order.status === "CANCEL_PENDING") {
      return {
        order,
        refunded: 0,
      };
    }

    if (!ACTIVE_ORDER_STATUSES.includes(order.status as (typeof ACTIVE_ORDER_STATUSES)[number])) {
      throw new ValidationError("Only open orders can be cancelled");
    }

    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        userId: input.userId,
        status: {
          in: [...ACTIVE_ORDER_STATUSES],
        },
      },
      data: {
        status: "CANCEL_PENDING",
      },
    });

    if (updated.count !== 1) {
      throw new ValidationError("Order changed before cancellation could be requested");
    }

    await enqueueCancelOrderCommand(tx, {
      orderId: order.id,
      symbol: order.symbol,
      userId: input.userId,
    });

    return {
      order: {
        ...order,
        status: "CANCEL_PENDING",
      },
      refunded: 0,
    };
  });
};
