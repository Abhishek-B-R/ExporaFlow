import { authOptions } from "@/lib/auth";
import { assertProjectRole, assertProjectPermission } from "@/lib/authz";
import { prisma } from "@/db";
import {
  ALLOWED_ATTACHMENT_MIME,
  MAX_ATTACHMENT_BYTES,
  saveIssueAttachmentFile,
} from "@/lib/issue-attachments";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const issueId = request.nextUrl.searchParams.get("issueId");
  if (!issueId) {
    return Response.json({ message: "issueId is required." }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { projectId: true },
  });
  if (!issue) {
    return Response.json({ message: "Ticket not found." }, { status: 404 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId: issue.projectId,
    minimum: Role.VIEWER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  const rows = await prisma.issueAttachment.findMany({
    where: { issueId },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const issueId = formData.get("issueId");
  const file = formData.get("file");

  if (typeof issueId !== "string" || !issueId) {
    return Response.json({ message: "issueId is required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ message: "file is required." }, { status: 400 });
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return Response.json(
      { message: `File too large (max ${MAX_ATTACHMENT_BYTES / (1024 * 1024)}MB).` },
      { status: 400 },
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_ATTACHMENT_MIME.has(mimeType)) {
    return Response.json({ message: "File type not allowed." }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { projectId: true, title: true },
  });
  if (!issue) {
    return Response.json({ message: "Ticket not found." }, { status: 404 });
  }

  const access = await assertProjectPermission({
    userId: session.user.id,
    projectId: issue.projectId,
    permission: "uploadAttachment",
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveIssueAttachmentFile({
    issueId,
    fileName: file.name,
    bytes,
  });

  const row = await prisma.issueAttachment.create({
    data: {
      issueId,
      fileName: file.name,
      mimeType,
      sizeBytes: file.size,
      storageKey,
      uploadedById: session.user.id,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json(row, { status: 201 });
}
