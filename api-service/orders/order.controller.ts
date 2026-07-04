import { Request, Response } from "express";
import { cancelOrderService, placeOrderService } from "./order.service.js";
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

    validateOrder(req.body);

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

    return res.json({
      success: true,
      orderId: result.order.id,
      refunded: result.refunded,
      message: "Cancel requested",
    });

  } catch (err) {
    return sendError(res, err, "Cancel failed");
  }
};