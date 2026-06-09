-- CreateEnum
CREATE TYPE "TicketUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable Customer
ALTER TABLE "Customer" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable Employee
ALTER TABLE "Employee" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable Issue
ALTER TABLE "Issue" ADD COLUMN "ticketNumber" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Issue" ADD COLUMN "urgency" "TicketUrgency" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Issue" ADD COLUMN "requesterName" TEXT;
ALTER TABLE "Issue" ADD COLUMN "requesterUserId" TEXT;

-- Backfill ticket numbers per project (ordered by creation time)
WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY "projectId" ORDER BY "createdAt" ASC) AS num
  FROM "Issue"
)
UPDATE "Issue" AS i
SET "ticketNumber" = numbered.num
FROM numbered
WHERE i.id = numbered.id;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Issue_projectId_ticketNumber_key" ON "Issue"("projectId", "ticketNumber");
