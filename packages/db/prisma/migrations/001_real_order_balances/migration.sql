ALTER TABLE "Order"
ADD COLUMN "remaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "lockedQuote" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "lockedBase" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Order"
SET "remaining" = "quantity"
WHERE "remaining" = 0
  AND "status" IN ('OPEN', 'PARTIALLY_FILLED');

CREATE TABLE "AssetBalance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "asset" TEXT NOT NULL,
  "free" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "locked" DOUBLE PRECISION NOT NULL DEFAULT 0,

  CONSTRAINT "AssetBalance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssetBalance_userId_asset_key" ON "AssetBalance"("userId", "asset");

ALTER TABLE "AssetBalance"
ADD CONSTRAINT "AssetBalance_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
