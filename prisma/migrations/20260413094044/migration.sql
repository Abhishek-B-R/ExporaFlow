-- DropIndex
DROP INDEX "public"."IssueActivity_issueId_createdAt_idx";

-- DropIndex
DROP INDEX "public"."IssueComment_issueId_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Notification_userId_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Notification_userId_readAt_idx";

-- DropIndex
DROP INDEX "public"."SavedView_ownerId_createdAt_idx";

-- Re-create critical indexes to preserve hot-path query performance
CREATE INDEX IF NOT EXISTS "IssueActivity_issueId_createdAt_idx" ON "IssueActivity"("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "IssueComment_issueId_createdAt_idx" ON "IssueComment"("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "SavedView_ownerId_createdAt_idx" ON "SavedView"("ownerId", "createdAt");
