import type { Request, Response } from "express";
import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { ENV } from "../../packages/config/env.js";
import { db } from "../../packages/db/client.js";

const getStripeSession = async (sessionId: string) => {
  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: {
      Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
    },
  });

  const session = await stripeRes.json();

  if (!stripeRes.ok) {
    throw new Error(session.error?.message || "Stripe session lookup failed");
  }

  return session;
};

const creditCompletedStripeSession = async (session: any) => {
  const sessionId = String(session.id || "");
  const userId = String(session.metadata?.userId || session.client_reference_id || "");
  const amountUsd = Number(session.amount_total || 0) / 100;
  const isPaid = session.payment_status === "paid" || session.status === "complete";

  if (!sessionId || !userId || !Number.isFinite(amountUsd) || amountUsd <= 0 || !isPaid) {
    throw new Error("Stripe session is not paid yet");
  }

  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingTopUp = await tx.paymentTopUp.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (existingTopUp?.status === "COMPLETED") {
      const wallet = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, balance: true },
      });

      return { wallet, credited: false };
    }

    await tx.paymentTopUp.upsert({
      where: { stripeSessionId: sessionId },
      create: {
        stripeSessionId: sessionId,
        userId,
        amountUsd,
        status: "COMPLETED",
        completedAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    const wallet = await tx.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: amountUsd,
        },
      },
      select: {
        id: true,
        email: true,
        balance: true,
      },
    });

    return { wallet, credited: true };
  });
};

export const createStripeCheckout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!ENV.STRIPE_SECRET_KEY || ENV.STRIPE_SECRET_KEY.includes("REPLACE_ME")) {
      return res.status(400).json({
        error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.",
      });
    }

    const amountUsd = Number(req.body.amountUsd || 0);

    if (!Number.isFinite(amountUsd) || amountUsd < 5) {
      return res.status(400).json({ error: "Top up amount must be at least $5" });
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${ENV.APP_URL}/balance?payment=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${ENV.APP_URL}/balance?payment=cancelled`);
    params.set("client_reference_id", user.userId);
    params.set("metadata[userId]", user.userId);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][unit_amount]", String(Math.round(amountUsd * 100)));
    params.set("line_items[0][price_data][product_data][name]", "Veltrix wallet top up");

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return res.status(stripeRes.status).json({
        error: session.error?.message || "Stripe checkout failed",
      });
    }

    await db.paymentTopUp.create({
      data: {
        stripeSessionId: session.id,
        userId: user.userId,
        amountUsd,
        status: "PENDING",
      },
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Payment failed" });
  }
};

export const confirmStripeCheckout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!ENV.STRIPE_SECRET_KEY || ENV.STRIPE_SECRET_KEY.includes("REPLACE_ME")) {
      return res.status(400).json({
        error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.",
      });
    }

    const sessionId = String(req.body.sessionId || "");

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId required" });
    }

    const session = await getStripeSession(sessionId);
    const sessionUserId = String(session.metadata?.userId || session.client_reference_id || "");

    if (sessionUserId !== user.userId) {
      return res.status(403).json({ error: "Payment session does not belong to this user" });
    }

    const result = await creditCompletedStripeSession(session);

    return res.json({
      success: true,
      wallet: result.wallet,
      credited: result.credited,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Payment confirmation failed" });
  }
};

const parseStripeSignature = (signature: string) => {
  return signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    if (!ENV.STRIPE_WEBHOOK_SECRET || ENV.STRIPE_WEBHOOK_SECRET.includes("REPLACE_ME")) {
      return res.status(400).json({ error: "Stripe webhook is not configured" });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const signature = String(req.headers["stripe-signature"] || "");
    const signatureParts = parseStripeSignature(signature);

    if (!signatureParts.t || !signatureParts.v1) {
      return res.status(400).json({ error: "Invalid Stripe signature" });
    }

    const signedPayload = `${signatureParts.t}.${rawBody.toString("utf8")}`;
    const expectedSignature = crypto
      .createHmac("sha256", ENV.STRIPE_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest("hex");

    if (
      expectedSignature.length !== signatureParts.v1.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signatureParts.v1))
    ) {
      return res.status(400).json({ error: "Stripe signature mismatch" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      await creditCompletedStripeSession(session);
    }

    return res.json({ received: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Stripe webhook failed" });
  }
};
