ALTER TABLE "User" ADD COLUMN "freescaleDayRateCents" INTEGER;
ALTER TABLE "FreescaleActivity"
  ADD COLUMN "contactName" TEXT,
  ADD COLUMN "source" TEXT,
  ADD COLUMN "assisted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "demo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "estimatedSeconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "externalId" TEXT;
CREATE UNIQUE INDEX "FreescaleActivity_emailAccountId_externalId_key" ON "FreescaleActivity"("emailAccountId", "externalId");
