-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('INCIDENT', 'CHANGE');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "designation" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ENGINEER',
    "organizationAccess" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserServiceLineGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceLine" "ProjectServiceLine" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserServiceLineGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserServiceLineGrant_userId_serviceLine_key" ON "UserServiceLineGrant"("userId", "serviceLine");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserServiceLineGrant" ADD CONSTRAINT "UserServiceLineGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "customerId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "ticketType" "TicketType" NOT NULL DEFAULT 'INCIDENT';

ALTER TABLE "Issue" ADD COLUMN "startDate" TIMESTAMP(3);

ALTER TABLE "Issue" ADD COLUMN "endDate" TIMESTAMP(3);

ALTER TABLE "Issue" ADD COLUMN "durationMinutes" INTEGER;

ALTER TABLE "Issue" ADD COLUMN "holdStartedAt" TIMESTAMP(3);

ALTER TABLE "Issue" ADD COLUMN "accumulatedHoldSeconds" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Issue" ADD COLUMN "slaDueAt" TIMESTAMP(3);
