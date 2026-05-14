import { db } from "../../packages/db/client.js";
import { eventBus } from "../events/eventEmitter.js";
import { ORDER_EVENT, type OrderEventPayload } from "../events/orderEvents.js";

let started = false;

const statusForOrder = (order: OrderEventPayload["order"]) => {
  if (order.remaining <= 0) return "FILLED";
  if (order.remaining < order.quantity) return "PARTIALLY_FILLED";
  return "OPEN";
};

export const startOrderWorker = () => {
  if (started) return;
  started = true;

  eventBus.on<OrderEventPayload>(ORDER_EVENT, async ({ order }) => {
    try {
      await db.order.updateMany({
        where: {
          id: order.dbId,
          status: {
            not: "CANCELLED",
          },
        },
        data: {
          remaining: order.remaining,
          status: statusForOrder(order),
        },
      });
    } catch (err) {
      console.error("Order persist error:", err);
    }
  });
};
