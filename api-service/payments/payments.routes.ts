import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { confirmStripeCheckout, createStripeCheckout } from "./payments.controller.js";

const router = Router();

router.post("/stripe/checkout", authMiddleware, createStripeCheckout);
router.post("/stripe/confirm", authMiddleware, confirmStripeCheckout);

export default router;
