import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { logIssueActivity, notifyUsers } from "@/lib/collaboration";
import { findDuplicateIssueCandidates } from "@/lib/ai/duplicates";
import { logEvent } from "@/lib/observability/logger";
import { Role } from "@prisma/client";

function normalizeIdentity(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  const {
    issueTitle,
    issueDescription,
    issueStatus,
    issuePriority,
    projectId,
    dueDate,
    labels,
    parentIssueId,
  } = await request.json();

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" }, { status: 401 });
  }

  if (!projectId) {
    return Response.json({ message: "projectId is required." }, { status: 400 });
  }
  if (!issueTitle || typeof issueTitle !== "string" || !issueTitle.trim()) {
    return Response.json({ message: "issueTitle is required." }, { status: 400 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId,
    minimum: Role.ENGINEER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  if (session.user.id) {
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
          message: "This issue already exists in this project.",
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
    const strongDuplicate = duplicateCandidates.find((candidate) => candidate.score >= 0.86);
    if (strongDuplicate) {
      return Response.json(
        {
          message: "This looks like an existing issue. Open the existing issue instead.",
          duplicate: strongDuplicate,
        },
        { status: 409 },
      );
    }

    const response = await prisma.issue.create({
      data: {
        title: issueTitle.trim(),
        description: typeof issueDescription === "string" ? issueDescription : "",
        status: issueStatus ?? "Backlog",
        priority: issuePriority ?? "No Priority",
        projectId: projectId,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: Array.isArray(labels) ? labels : [],
        parentIssueId: parentIssueId ?? null,
      },
    });
    if (response) {
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
        await notifyUsers({
          userIds: [
            project?.createdBy ?? "",
            ...(project?.projectMembers.map((member) => member.userId) ?? []),
          ],
          actorId: session.user.id,
          type: "ISSUE_CREATED",
          title: "New issue created",
          body: response.title,
          issueId: response.id,
          projectId,
        });
      } catch (sideEffectError) {
        console.error("Non-fatal issue creation side-effect failure:", sideEffectError);
      }

      return Response.json({
        message: "New issue created!",
        issueId: response.id,
        duplicateSuggestions: duplicateCandidates.filter((candidate) => candidate.id !== response.id),
      });
    }
  }
  logEvent("warn", "Issue creation returned no response row.", {
    projectId,
    userId: session.user.id,
  });
  return Response.json({ message: "Error occured!" });
}
