import { Request, Response } from "express";
import { cancelOrderService, placeOrderService } from "./order.service.js";
import { pub } from "../lib/redis.js";
import { generateId } from "../../packages/utils/generateId.js";
import { validateOrder } from "../../packages/validators/order.validator.js";
import type { Order } from "../../packages/types/order.types.js";
import { getAuthUser, sendError, type AuthenticatedRequest } from "../lib/http.js";

/**
 * CREATE ORDER
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req as AuthenticatedRequest, res);
    if (!user) return;

    // 1. Validate input
    validateOrder(req.body);

    // 2. Build order
    const order: Order = {
      id: generateId(),
      userId: user.userId,
      symbol: req.body.symbol,
      price: req.body.price,
      quantity: req.body.quantity,
      side: req.body.side,
      type: req.body.type,
      timestamp: Date.now(),
      status: "OPEN",
    };

    // 3. Send to service (publishes to Redis)
    await placeOrderService(order);

    return res.json({
      success: true,
      orderId: order.id,
      message: "Order accepted",
    });

  } catch (err) {
    return sendError(res, err, "Order failed");
  }
};

/**
 * CANCEL ORDER
 */
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req as AuthenticatedRequest, res);
    if (!user) return;

    const orderId = req.params.orderId || req.body.orderId;

    if (!orderId) {
      return res.status(400).json({
        error: "orderId required",
      });
    }

    const result = await cancelOrderService({
      orderId: String(orderId),
      userId: user.userId,
    });

    try {
      await pub.publish(
        "cancel_orders",
        JSON.stringify({
          orderId: result.order.id,
          symbol: result.order.symbol,
          userId: user.userId,
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      console.warn("Cancel order persisted but Redis publish failed:", message);
    }

    return res.json({
      success: true,
      orderId: result.order.id,
      refunded: result.refunded,
      message: "Order cancelled",
    });

  } catch (err) {
    return sendError(res, err, "Cancel failed");
  }
};
