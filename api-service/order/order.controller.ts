import { Request, Response } from "express";
import { cancelOrderService, placeOrderService } from "./order.service.js";
import { pub } from "../lib/redis.js";

// ⚠️ IMPORTANT: import DIRECTLY from correct files (not index.js barrel)
import { generateId } from "../../packages/utils/generateId.js";
import { validateOrder } from "../../packages/validators/order.validator.js";
import type { Order } from "../../packages/types/order.types.js";

/**
 * CREATE ORDER
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user.userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

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

  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Order failed",
    });
  }
};

/**
 * CANCEL ORDER
 */
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orderId = req.params.orderId || req.body.orderId;

    if (!user || !user.userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

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
    } catch (err: any) {
      console.warn("Cancel order persisted but Redis publish failed:", err.message);
    }

    return res.json({
      success: true,
      orderId: result.order.id,
      refunded: result.refunded,
      message: "Order cancelled",
    });

  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Cancel failed",
    });
  }
};
