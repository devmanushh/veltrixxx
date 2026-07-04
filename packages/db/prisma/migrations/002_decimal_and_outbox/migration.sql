ALTER TABLE "User"
ALTER COLUMN "balance" TYPE DECIMAL(36, 18) USING "balance"::numeric;

ALTER TABLE "Order"
ALTER COLUMN "price" TYPE DECIMAL(36, 18) USING "price"::numeric,
ALTER COLUMN "quantity" TYPE DECIMAL(36, 18) USING "quantity"::numeric,
ALTER COLUMN "remaining" TYPE DECIMAL(36, 18) USING "remaining"::numeric,
ALTER COLUMN "lockedQuote" TYPE DECIMAL(36, 18) USING "lockedQuote"::numeric,
ALTER COLUMN "lockedBase" TYPE DECIMAL(36, 18) USING "lockedBase"::numeric;

ALTER TABLE "AssetBalance"
ALTER COLUMN "free" TYPE DECIMAL(36, 18) USING "free"::numeric,
ALTER COLUMN "locked" TYPE DECIMAL(36, 18) USING "locked"::numeric;

ALTER TABLE "Trade"
ALTER COLUMN "price" TYPE DECIMAL(36, 18) USING "price"::numeric,
ALTER COLUMN "quantity" TYPE DECIMAL(36, 18) USING "quantity"::numeric;

ALTER TABLE "Candle"
ALTER COLUMN "open" TYPE DECIMAL(36, 18) USING "open"::numeric,
ALTER COLUMN "high" TYPE DECIMAL(36, 18) USING "high"::numeric,
ALTER COLUMN "low" TYPE DECIMAL(36, 18) USING "low"::numeric,
ALTER COLUMN "close" TYPE DECIMAL(36, 18) USING "close"::numeric,
ALTER COLUMN "volume" TYPE DECIMAL(36, 18) USING "volume"::numeric;

ALTER TABLE "PaymentTopUp"
ALTER COLUMN "amountUsd" TYPE DECIMAL(36, 18) USING "amountUsd"::numeric;

CREATE TABLE "OutboxEvent" (
  "id" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dispatchedAt" TIMESTAMP(3),

  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OutboxEvent_status_createdAt_idx" ON "OutboxEvent"("status", "createdAt");