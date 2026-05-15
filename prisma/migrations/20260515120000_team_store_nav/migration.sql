-- AlterTable Team
ALTER TABLE "Team" ADD COLUMN "description" TEXT;
ALTER TABLE "Team" ADD COLUMN "managerId" TEXT;
ALTER TABLE "Team" ADD COLUMN "serviceLine" "ProjectServiceLine";

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Project
ALTER TABLE "Project" ADD COLUMN "teamId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Employee
ALTER TABLE "Employee" ADD COLUMN "teamId" TEXT;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
