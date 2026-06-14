import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { logIssueActivity, notifyUsers } from "@/lib/collaboration";
import { findDuplicateIssueCandidates } from "@/lib/ai/duplicates";
import { Role, TicketType, TicketUrgency } from "@prisma/client";
import { createIssueBodySchema } from "@/lib/ticket-schemas";
import { computeDueDateFromPolicy } from "@/lib/ticket-due-date-policy";
import {
  allocateGlobalTicketNumber,
  allocateTicketNumber,
} from "@/lib/ticket-numbers";
import { computeInitialSlaDueAt, parseStoredDate } from "@/lib/ticket-sla";
import { isChangeManagementType } from "@/lib/ticket-types";
import {
  diffNewMentionIds,
  loadMentionCandidatesForProject,
} from "@/lib/mention-candidates";
import { queueMentionEmails } from "@/lib/mention-email";
import { saveCloudinaryAttachments } from "@/lib/save-cloudinary-attachments";

function normalizeIdentity(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  const raw = await request.json();
  const parsed = createIssueBodySchema.safeParse(raw);

  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      Object.values(first).flat()[0] ??
      parsed.error.errors[0]?.message ??
      "Invalid request.";
    return Response.json(
      { message: msg, issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    issueTitle,
    issueDescription,
    issueStatus,
    issuePriority,
    projectId,
    dueDate,
    labels,
    parentIssueId,
    ticketType,
    startDate,
    endDate,
    durationMinutes,
    assignedUser,
    urgency,
    requesterName,
    requesterEmail,
    cloudinaryMedia,
  } = parsed.data;

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" }, { status: 401 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId,
    minimum: Role.ENGINEER,
  });
  if (!access.ok) {
    return Response.json(
      { message: access.message },
      { status: access.status },
    );
  }

  const normalizedTitle = normalizeIdentity(issueTitle);
  const recentIssues = await prisma.issue.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  const exactDuplicate = recentIssues.find(
    (issue) => normalizeIdentity(issue.title) === normalizedTitle,
  );
  if (exactDuplicate) {
    return Response.json(
      {
        message: "This ticket already exists in this project.",
        duplicate: exactDuplicate,
      },
      { status: 409 },
    );
  }

  const duplicateCandidates = await findDuplicateIssueCandidates({
    projectId,
    title: issueTitle,
    description: issueDescription,
    take: 3,
  });
  const strongDuplicate = duplicateCandidates.find(
    (candidate) => candidate.score >= 0.86,
  );
  if (strongDuplicate) {
    return Response.json(
      {
        message:
          "This looks like an existing ticket. Open the existing ticket instead.",
        duplicate: strongDuplicate,
      },
      { status: 409 },
    );
  }

  const tType = ticketType;
  const start = parseStoredDate(
    typeof startDate === "string" ? startDate : undefined,
  );
  const end = parseStoredDate(
    typeof endDate === "string" ? endDate : undefined,
  );
  const parsedDue = parseStoredDate(
    typeof dueDate === "string" ? dueDate : undefined,
  );
  const effectiveUrgency = urgency ?? TicketUrgency.MEDIUM;
  const effectivePriority = issuePriority ?? "Medium";
  const due =
    parsedDue ??
    (!isChangeManagementType(tType)
      ? computeDueDateFromPolicy({
          urgency: effectiveUrgency,
          priority: effectivePriority,
          ticketType: tType,
        })
      : null);

  const [ticketNumber, globalTicketNumber] = await Promise.all([
    allocateTicketNumber(projectId),
    allocateGlobalTicketNumber(),
  ]);
  const sessionUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  const resolvedRequesterName =
    requesterName?.trim() ||
    sessionUser?.name?.trim() ||
    sessionUser?.email?.split("@")[0] ||
    "Unknown";
  const resolvedRequesterEmail =
    (typeof requesterEmail === "string" && requesterEmail.trim()) ||
    sessionUser?.email?.trim() ||
    null;

  const slaDueAt = isChangeManagementType(tType)
    ? computeInitialSlaDueAt({
        startDate: start,
        endDate: end,
        durationMinutes: durationMinutes ?? null,
      })
    : null;

  const descriptionText =
    typeof issueDescription === "string" ? issueDescription : "";

  const response = await prisma.issue.create({
    data: {
      title: issueTitle.trim(),
      description: descriptionText,
      status: issueStatus ?? "Backlog",
      priority: effectivePriority,
      urgency: effectiveUrgency,
      ticketNumber,
      globalTicketNumber,
      requesterName: resolvedRequesterName,
      requesterEmail: resolvedRequesterEmail,
      requesterUserId: session.user.id,
      projectId,
      dueDate: due,
      labels: Array.isArray(labels) ? labels : [],
      parentIssueId: parentIssueId ?? null,
      ticketType: tType,
      startDate: start,
      endDate: end,
      durationMinutes: durationMinutes ?? null,
      slaDueAt,
      assignedUser:
        typeof assignedUser === "string" && assignedUser.length > 0
          ? assignedUser
          : null,
    },
  });

  try {
    await logIssueActivity({
      issueId: response.id,
      actorId: session.user.id,
      action: "ISSUE_CREATED",
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        createdBy: true,
        projectMembers: { select: { userId: true } },
      },
    });
    const notifyIds = new Set(
      [
        project?.createdBy ?? "",
        ...(project?.projectMembers.map((member) => member.userId) ?? []),
        typeof assignedUser === "string" && assignedUser.length > 0
          ? assignedUser
          : "",
      ].filter(Boolean),
    );
    await notifyUsers({
      userIds: [...notifyIds],
      actorId: session.user.id,
      type: "ISSUE_CREATED",
      title: "New ticket created",
      body: response.title,
      issueId: response.id,
      projectId,
    });
  } catch (sideEffectError) {
    console.error(
      "Non-fatal issue creation side-effect failure:",
      sideEffectError,
    );
  }

  if (descriptionText.trim()) {
    try {
      const candidates = await loadMentionCandidatesForProject(
        projectId,
        session.user.id,
      );
      const mentionedUserIds = diffNewMentionIds({
        previousText: "",
        nextText: descriptionText,
        candidates,
      });
      if (mentionedUserIds.length > 0) {
        queueMentionEmails({
          mentionedUserIds,
          actorId: session.user.id,
          issueId: response.id,
          projectId,
          issueTitle: response.title,
          excerpt: descriptionText,
          ticketType: tType,
          ticketNumber,
          globalTicketNumber,
          sourceType: "description_create",
          sourceId: response.id,
        });
      }
    } catch (mentionError) {
      console.error("Mention email on create failed:", mentionError);
    }
  }

  if (cloudinaryMedia?.length) {
    try {
      await saveCloudinaryAttachments({
        issueId: response.id,
        uploadedById: session.user.id,
        media: cloudinaryMedia,
      });
    } catch (attachmentError) {
      console.error("Cloudinary attachment save failed:", attachmentError);
    }
  }

  return Response.json({
    message: "New ticket created!",
    issueId: response.id,
    duplicateSuggestions: duplicateCandidates.filter(
      (candidate) => candidate.id !== response.id,
    ),
  });
}
