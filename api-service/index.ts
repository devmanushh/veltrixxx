import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import orderRoutes from "./orders/order.routes.js";
import walletRoutes from "./wallet/wallet.routes.js";
import activityRoutes from "./activity/activity.routes.js";
import paymentRoutes from "./payments/payments.routes.js";
import marketRoutes from "./market/market.routes.js";
import { handleStripeWebhook } from "./payments/payments.controller.js";
import { ENV } from "../packages/config/env.js";
import { db } from "../packages/db/client.js";
import { startOrderCommandOutboxDispatcher } from "./outbox/orderCommandOutbox.js";

const app = express();

startOrderCommandOutboxDispatcher();

app.use(cors({
  origin: ENV.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  credentials: true,
}));
app.post("/payments/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/order", orderRoutes);
app.use("/spot/:market/order", orderRoutes);

app.use("/wallet", walletRoutes);
app.use("/activity", activityRoutes);
app.use("/payments", paymentRoutes);
app.use("/market", marketRoutes);

app.get("/", (_, res) => {
  res.json({
    status: "ok",
    service: "veltrix-api",
    web: "http://localhost:3000",
    health: "/health",
  });
});

app.get("/health", (_, res) => {
  res.send("API OK");
});

app.get("/health/db", async (_, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database unavailable";

    res.status(500).json({
      status: "error",
      error: message,
    });
  }
});

app.listen(ENV.API_PORT, () => {
  console.log(`API running on port ${ENV.API_PORT}`);
});
