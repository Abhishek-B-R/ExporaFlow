-- CreateEnum
CREATE TYPE "ProjectServiceLine" AS ENUM (
  'SAP_CONSULTING',
  'ORACLE_CONSULTING',
  'MANAGED_SERVICES',
  'SOFTWARE_DEVELOPMENT'
);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "serviceLine" "ProjectServiceLine";
