import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { prisma } from "@/db";
import { deleteIssueAttachmentFile } from "@/lib/issue-attachments";
import {
  configureCloudinary,
  isCloudinaryAttachment,
} from "@/lib/cloudinary-config";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const attachment = await prisma.issueAttachment.findUnique({
    where: { id },
    include: { issue: { select: { projectId: true } } },
  });
  if (!attachment) {
    return Response.json({ message: "Attachment not found." }, { status: 404 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId: attachment.issue.projectId,
    minimum: Role.MANAGER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  if (
    isCloudinaryAttachment(attachment) &&
    attachment.cloudinaryPublicId
  ) {
    try {
      const cloudinary = configureCloudinary();
      const resourceType =
        attachment.resourceType === "video" ? "video" : "image";
      await cloudinary.uploader.destroy(attachment.cloudinaryPublicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      console.error("Cloudinary delete failed:", error);
    }
  } else {
    await deleteIssueAttachmentFile(attachment.storageKey);
  }

  await prisma.issueAttachment.delete({ where: { id } });

  return Response.json({ ok: true });
}
