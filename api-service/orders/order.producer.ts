import { ORDER_COMMAND_TYPES } from "../../packages/redis/channels.js";
import type { DbTransactionClient } from "../../packages/db/client.js";
import type { Order } from "../../packages/types/index.js";
import { enqueueOrderCommand } from "../outbox/orderCommandOutbox.js";

export const enqueuePlaceOrderCommand = async (
  tx: DbTransactionClient,
  order: Order
) => {
  await enqueueOrderCommand(tx, ORDER_COMMAND_TYPES.PLACE, order);
};

export const enqueueCancelOrderCommand = async (
  tx: DbTransactionClient,
  payload: {
    orderId: string;
    symbol: string;
    userId: string;
  }
) => {
  await enqueueOrderCommand(tx, ORDER_COMMAND_TYPES.CANCEL, payload);
};