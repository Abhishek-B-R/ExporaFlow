-- Expand Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CUSTOMER';

-- Expand TicketType enum
ALTER TYPE "TicketType" ADD VALUE IF NOT EXISTS 'CHANGE_REQUEST';
ALTER TYPE "TicketType" ADD VALUE IF NOT EXISTS 'SERVICE_REQUEST';
ALTER TYPE "TicketType" ADD VALUE IF NOT EXISTS 'PROBLEM';
ALTER TYPE "TicketType" ADD VALUE IF NOT EXISTS 'TASK';
ALTER TYPE "TicketType" ADD VALUE IF NOT EXISTS 'BUG';
ALTER TYPE "TicketType" ADD VALUE IF NOT EXISTS 'ENHANCEMENT';

-- Global ticket sequence
CREATE TABLE IF NOT EXISTS "GlobalTicketSequence" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GlobalTicketSequence_pkey" PRIMARY KEY ("id")
);

INSERT INTO "GlobalTicketSequence" ("id", "lastNumber")
VALUES ('singleton', 0)
ON CONFLICT ("id") DO NOTHING;

-- Issue: global ticket number + requester email
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "globalTicketNumber" INTEGER;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "requesterEmail" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Issue_globalTicketNumber_key" ON "Issue"("globalTicketNumber");

-- Backfill global ticket numbers in creation order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "Issue"
  WHERE "globalTicketNumber" IS NULL
)
UPDATE "Issue" i
SET "globalTicketNumber" = numbered.rn
FROM numbered
WHERE i.id = numbered.id;

UPDATE "GlobalTicketSequence"
SET "lastNumber" = COALESCE((SELECT MAX("globalTicketNumber") FROM "Issue"), 0)
WHERE "id" = 'singleton';

-- User customer portal link
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customerProfileId" TEXT;
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_customerProfileId_fkey"
    FOREIGN KEY ("customerProfileId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Mention email delivery log
CREATE TABLE IF NOT EXISTS "MentionEmailLog" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MentionEmailLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MentionEmailLog_dedupeKey_key" ON "MentionEmailLog"("dedupeKey");
CREATE INDEX IF NOT EXISTS "MentionEmailLog_issueId_mentionedUserId_idx" ON "MentionEmailLog"("issueId", "mentionedUserId");

DO $$ BEGIN
  ALTER TABLE "MentionEmailLog" ADD CONSTRAINT "MentionEmailLog_issueId_fkey"
    FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Export audit log
CREATE TABLE IF NOT EXISTS "ExportAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "format" TEXT NOT NULL,
    "filters" JSONB,
    "rowCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExportAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExportAuditLog_userId_createdAt_idx" ON "ExportAuditLog"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ExportAuditLog" ADD CONSTRAINT "ExportAuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
