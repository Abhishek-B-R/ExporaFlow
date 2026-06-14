-- Cloudinary-backed ticket media (images/videos)
ALTER TABLE "IssueAttachment" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "IssueAttachment" ADD COLUMN "cloudinaryPublicId" TEXT;
ALTER TABLE "IssueAttachment" ADD COLUMN "deliveryUrl" TEXT;
ALTER TABLE "IssueAttachment" ADD COLUMN "resourceType" TEXT;

CREATE UNIQUE INDEX "IssueAttachment_cloudinaryPublicId_key" ON "IssueAttachment"("cloudinaryPublicId");
