import { Router } from "express";
import { cancelOrder, createOrder } from "./order.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";

const router = Router({ mergeParams: true });

router.post("/", authMiddleware, createOrder);
router.delete("/:orderId", authMiddleware, cancelOrder);
router.post("/cancel", authMiddleware, cancelOrder);

export default router;
