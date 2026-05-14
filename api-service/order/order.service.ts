import { sendOrderToEngine } from "./order.producer.js"; // or same file
import { db, type DbTransactionClient } from "../../packages/db/client.js";
import { ValidationError } from "../../packages/errors/index.js";
import type { Order } from "../../packages/types/index.js";
import { parseMarketAssets } from "../../packages/utils/parseMarketAssets.js";

const isQuoteWalletAsset = (asset: string) => ["USDT", "USD", "DEV"].includes(asset);

export const placeOrderService = async (order: Order) => {
  if (order.type !== "limit") {
    throw new ValidationError("Market orders require a live price source before they can be enabled");
  }

  const orderValue = Number(order.price || 0) * Number(order.quantity || 0);

  if (!Number.isFinite(orderValue) || orderValue <= 0) {
    throw new ValidationError("Order value must be greater than 0");
  }

  try {
    const { base, quote } = parseMarketAssets(order.symbol);

    await db.$transaction(async (tx: DbTransactionClient) => {
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
              gte: order.quantity,
            },
          },
          data: {
            free: {
              decrement: order.quantity,
            },
            locked: {
              increment: order.quantity,
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
          price: order.price ?? null,
          quantity: order.quantity,
          remaining: order.quantity,
          lockedQuote: order.side === "buy" ? orderValue : 0,
          lockedBase: order.side === "sell" ? order.quantity : 0,
          side: order.side,
          type: order.type,
          status: "OPEN",
        },
      });
    });

    await sendOrderToEngine(order);
  } catch (err) {
    const existing = await db.order.findUnique({ where: { id: order.id } });

    if (existing?.status === "OPEN") {
      await refundOpenOrder(existing.id);
    }

    throw err;
  }

  return {
    success: true,
    message: "Order sent to engine",
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

    if (!["OPEN", "PARTIALLY_FILLED"].includes(order.status)) {
      throw new ValidationError("Only open orders can be cancelled");
    }

    const { base, quote } = parseMarketAssets(order.symbol);
    const refundedQuote = Number(order.lockedQuote || 0);
    const refundedBase = Number(order.lockedBase || 0);

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        lockedQuote: 0,
        lockedBase: 0,
      },
    });

    if (order.side.toLowerCase() === "buy" && refundedQuote > 0) {
      if (!isQuoteWalletAsset(quote)) {
        throw new ValidationError(`Unsupported quote asset ${quote}`);
      }

      await tx.user.update({
        where: { id: input.userId },
        data: {
          balance: {
            increment: refundedQuote,
          },
        },
      });
    }

    if (order.side.toLowerCase() === "sell" && refundedBase > 0) {
      await tx.assetBalance.upsert({
        where: {
          userId_asset: {
            userId: input.userId,
            asset: base,
          },
        },
        create: {
          userId: input.userId,
          asset: base,
          free: refundedBase,
          locked: 0,
        },
        update: {
          free: {
            increment: refundedBase,
          },
          locked: {
            decrement: refundedBase,
          },
        },
      });
    }

    return {
      order,
      refunded: order.side.toLowerCase() === "buy" ? refundedQuote : refundedBase,
    };
  });
};

const refundOpenOrder = async (orderId: string) => {
  await db.$transaction(async (tx: DbTransactionClient) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || !["OPEN", "PARTIALLY_FILLED"].includes(order.status)) return;

    const { base, quote } = parseMarketAssets(order.symbol);
    const side = order.side.toLowerCase();

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        lockedQuote: 0,
        lockedBase: 0,
      },
    });

    if (side === "buy" && order.lockedQuote > 0) {
      if (!isQuoteWalletAsset(quote)) {
        throw new ValidationError(`Unsupported quote asset ${quote}`);
      }

      await tx.user.update({
        where: { id: order.userId },
        data: {
          balance: {
            increment: order.lockedQuote,
          },
        },
      });
    }

    if (side === "sell" && order.lockedBase > 0) {
      await tx.assetBalance.upsert({
        where: {
          userId_asset: {
            userId: order.userId,
            asset: base,
          },
        },
        create: {
          userId: order.userId,
          asset: base,
          free: order.lockedBase,
          locked: 0,
        },
        update: {
          free: {
            increment: order.lockedBase,
          },
          locked: {
            decrement: order.lockedBase,
          },
        },
      });
    }
  });
};
