import type { Request, Response } from "express";
import crypto from "node:crypto";
import { ENV } from "../../packages/config/env.js";
import { db, type DbTransactionClient } from "../../packages/db/client.js";
import { toNumber } from "../../packages/utils/decimal.js";
import { getAuthUser, sendError, type AuthenticatedRequest } from "../lib/http.js";

type StripeCheckoutSession = {
  id?: string;
  url?: string;
  amount_total?: number;
  payment_status?: string;
  status?: string;
  client_reference_id?: string;
  metadata?: {
    userId?: string;
  };
  error?: {
    message?: string;
  };
};

class PaymentOwnershipError extends Error {
  constructor() {
    super("Payment session does not belong to this user");
  }
}

const serializeWallet = <T extends { balance: Parameters<typeof toNumber>[0] } | null>(wallet: T) => {
  if (!wallet) return wallet;

  return {
    ...wallet,
    balance: toNumber(wallet.balance),
  };
};

const getStripeSession = async (sessionId: string) => {
  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: {
      Authorization: `Bearer ${ENV.STRIPE_SECRET_KEY}`,
    },
  });

  const session = (await stripeRes.json()) as StripeCheckoutSession;

  if (!stripeRes.ok) {
    throw new Error(session.error?.message || "Stripe session lookup failed");
  }

  return session;
};

const getStripeBoundUserId = (session: StripeCheckoutSession) => {
  return String(session.metadata?.userId || session.client_reference_id || "");
};

const getAllowedOrigins = () => {
  return ENV.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
};

const getCheckoutAppUrl = (req: Request) => {
  const origin = String(req.headers.origin || "").replace(/\/+$/, "");

  if (origin && getAllowedOrigins().includes(origin)) {
    return origin;
  }

  return ENV.APP_URL;
};
const creditCompletedStripeSession = async (
  session: StripeCheckoutSession,
  expectedUserId?: string
) => {
  const sessionId = String(session.id || "");
  const stripeBoundUserId = getStripeBoundUserId(session);
  const amountUsd = Number(session.amount_total || 0) / 100;
  const isPaid = session.payment_status === "paid" || session.status === "complete";

  if (!sessionId || !Number.isFinite(amountUsd) || amountUsd <= 0 || !isPaid) {
    throw new Error("Stripe session is not paid yet");
  }

  return db.$transaction(async (tx: DbTransactionClient) => {
    const existingTopUp = await tx.paymentTopUp.findUnique({
      where: { stripeSessionId: sessionId },
    });

    const ownerUserId = existingTopUp?.userId || stripeBoundUserId;

    if (!ownerUserId) {
      throw new Error("Payment session has no Veltrix user binding");
    }

    if (expectedUserId && ownerUserId !== expectedUserId) {
      throw new PaymentOwnershipError();
    }

    if (existingTopUp?.status === "COMPLETED") {
      const wallet = await tx.user.findUnique({
        where: { id: ownerUserId },
        select: { id: true, email: true, balance: true },
      });

      return { wallet: serializeWallet(wallet), credited: false };
    }

    await tx.paymentTopUp.upsert({
      where: { stripeSessionId: sessionId },
      create: {
        stripeSessionId: sessionId,
        userId: ownerUserId,
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
      where: { id: ownerUserId },
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

    return { wallet: serializeWallet(wallet), credited: true };
  });
};

export const createStripeCheckout = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req as AuthenticatedRequest, res);
    if (!user) return;

    if (!ENV.STRIPE_SECRET_KEY || ENV.STRIPE_SECRET_KEY.includes("REPLACE_ME")) {
      return res.status(400).json({
        error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.",
      });
    }

    const amountUsd = Number(req.body.amountUsd || 0);

    if (!Number.isFinite(amountUsd) || amountUsd < 5) {
      return res.status(400).json({ error: "Top up amount must be at least $5" });
    }

    const appUrl = getCheckoutAppUrl(req);
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${appUrl}/balance?payment=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${appUrl}/balance?payment=cancelled`);
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

    const session = (await stripeRes.json()) as StripeCheckoutSession;

    if (!stripeRes.ok) {
      return res.status(stripeRes.status).json({
        error: session.error?.message || "Stripe checkout failed",
      });
    }

    if (!session.id || !session.url) {
      return res.status(502).json({ error: "Stripe checkout response was incomplete" });
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
  } catch (err) {
    return sendError(res, err, "Payment failed");
  }
};

export const confirmStripeCheckout = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req as AuthenticatedRequest, res);
    if (!user) return;

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
    const result = await creditCompletedStripeSession(session, user.userId);

    return res.json({
      success: true,
      wallet: result.wallet,
      credited: result.credited,
    });
  } catch (err) {
    if (err instanceof PaymentOwnershipError) {
      return res.status(403).json({ error: err.message });
    }

    return sendError(res, err, "Payment confirmation failed", 400);
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
      const session = event.data?.object as StripeCheckoutSession;
      await creditCompletedStripeSession(session);
    }

    return res.json({ received: true });
  } catch (err) {
    return sendError(res, err, "Stripe webhook failed", 400);
  }
};