import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { prisma } from "@/db";
import { deleteIssueAttachmentFile } from "@/lib/issue-attachments";
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

  await deleteIssueAttachmentFile(attachment.storageKey);
  await prisma.issueAttachment.delete({ where: { id } });

  return Response.json({ ok: true });
}
