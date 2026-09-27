-- Multi-assignee support.
-- Issue.assignedUser is kept as the primary/accountable owner; this table
-- holds the full assignee list (including that primary owner).

CREATE TABLE "IssueAssignee" (
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueAssignee_pkey" PRIMARY KEY ("issueId","userId")
);

CREATE INDEX "IssueAssignee_userId_idx" ON "IssueAssignee"("userId");

ALTER TABLE "IssueAssignee" ADD CONSTRAINT "IssueAssignee_issueId_fkey"
    FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IssueAssignee" ADD CONSTRAINT "IssueAssignee_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every ticket that already has an owner gets that owner as its
-- first assignee, so existing data is consistent from the moment this lands.
INSERT INTO "IssueAssignee" ("issueId", "userId", "assignedAt")
SELECT "id", "assignedUser", COALESCE("createdAt", CURRENT_TIMESTAMP)
FROM "Issue"
WHERE "assignedUser" IS NOT NULL
ON CONFLICT DO NOTHING;
