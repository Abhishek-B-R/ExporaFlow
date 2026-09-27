-- Reconcile migration history with prisma/schema.prisma.
--
-- Issue.estimate and the Label table existed in schema.prisma but had no
-- migration, so `prisma migrate deploy` against a fresh database produced a
-- schema the application could not use (P2022: column does not exist).
--
-- Written idempotently: databases that already picked these objects up via
-- `prisma db push` are left untouched, and fresh databases get them.

ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "estimate" INTEGER;

CREATE TABLE IF NOT EXISTS "Label" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6f86ff',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Label_workspaceId_name_key"
    ON "Label"("workspaceId", "name");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Label_workspaceId_fkey'
    ) THEN
        ALTER TABLE "Label" ADD CONSTRAINT "Label_workspaceId_fkey"
            FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Prisma manages @updatedAt in application code, so the database-level
-- defaults here diverge from the schema.
ALTER TABLE "Customer" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Employee" ALTER COLUMN "updatedAt" DROP DEFAULT;
