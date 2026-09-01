CREATE TABLE "FreescaleTask" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "due" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "assignees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "context" TEXT,
    "sourceThreadId" TEXT,
    "contactName" TEXT,
    "contactAvatarPosition" TEXT,
    "emailAccountId" TEXT NOT NULL,

    CONSTRAINT "FreescaleTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FreescaleTask_emailAccountId_status_idx" ON "FreescaleTask"("emailAccountId", "status");
CREATE INDEX "FreescaleTask_emailAccountId_due_idx" ON "FreescaleTask"("emailAccountId", "due");
CREATE UNIQUE INDEX "FreescaleTask_emailAccountId_sourceThreadId_key" ON "FreescaleTask"("emailAccountId", "sourceThreadId");

ALTER TABLE "FreescaleTask" ADD CONSTRAINT "FreescaleTask_emailAccountId_fkey" FOREIGN KEY ("emailAccountId") REFERENCES "EmailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
