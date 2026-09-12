ALTER TABLE "Newsletter" ADD COLUMN "briefIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "briefScannedAt" TIMESTAMP(3),
ADD COLUMN "briefThreads" JSONB;
