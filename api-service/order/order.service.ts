import { sendOrderToEngine } from "./order.producer.js"; // or same file
import { db } from "../../packages/db/client.js";
import { ValidationError } from "../../packages/errors/index.js";
import type { Order } from "../../packages/types/index.js";
import type { Prisma } from "@prisma/client";


export const placeOrderService = async (order: Order) => {
  const orderValue = Number(order.price || 0) * Number(order.quantity || 0);

  if (!Number.isFinite(orderValue) || orderValue <= 0) {
    throw new ValidationError("Order value must be greater than 0");
  }

  const walletDebit = await db.user.updateMany({
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

  try {
    await db.order.create({
      data: {
        id: order.id,
        userId: order.userId,
        symbol: order.symbol,
        price: order.price ?? null,
        quantity: order.quantity,
        side: order.side,
        type: order.type,
        status: "OPEN",
      },
    });

    await sendOrderToEngine(order);
  } catch (err) {
    await db.order.deleteMany({
      where: { id: order.id },
    });

    await db.user.update({
      where: { id: order.userId },
      data: {
        balance: {
          increment: orderValue,
        },
      },
    });

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
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order || order.userId !== input.userId) {
      throw new ValidationError("Order not found");
    }

    if (order.status !== "OPEN") {
      throw new ValidationError("Only open orders can be cancelled");
    }

    const orderValue = Number(order.price || 0) * Number(order.quantity || 0);

    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    if (Number.isFinite(orderValue) && orderValue > 0) {
      await tx.user.update({
        where: { id: input.userId },
        data: {
          balance: {
            increment: orderValue,
          },
        },
      });
    }

    return {
      order,
      refunded: orderValue,
    };
  });
};
