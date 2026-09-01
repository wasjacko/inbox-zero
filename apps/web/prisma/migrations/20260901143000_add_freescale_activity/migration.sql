-- CreateEnum
CREATE TYPE "FreescaleActivityType" AS ENUM (
  'REPLY_SENT',
  'FOLLOW_UP_SENT',
  'MESSAGE_SENT',
  'TASK_COMPLETED'
);

-- CreateTable
CREATE TABLE "FreescaleActivity" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" "FreescaleActivityType" NOT NULL,
  "threadId" TEXT,
  "contactAddress" TEXT,
  "emailAccountId" TEXT NOT NULL,

  CONSTRAINT "FreescaleActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreescaleActivity_emailAccountId_createdAt_idx"
ON "FreescaleActivity"("emailAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "FreescaleActivity_emailAccountId_type_createdAt_idx"
ON "FreescaleActivity"("emailAccountId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "FreescaleActivity"
ADD CONSTRAINT "FreescaleActivity_emailAccountId_fkey"
FOREIGN KEY ("emailAccountId") REFERENCES "EmailAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
