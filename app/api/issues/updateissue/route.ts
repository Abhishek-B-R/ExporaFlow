import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";
import { canTransitionIssueStatus } from "@/lib/issue-status-machine";

export async function PATCH(request: NextRequest) {
  const {
    issueId,
    issueTitle,
    issueDescription,
    issuePriority,
    issueStatus,
    assignedUser,
    parentIssueId,
    dueDate,
    labels,
  } = await request.json();

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return new Response(JSON.stringify({ message: "Kindly log in!" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const existing = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { projectId: true, status: true },
    });

    if (!existing) {
      return new Response(JSON.stringify({ message: "Issue not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const access = await assertProjectRole({
      userId: session.user.id,
      projectId: existing.projectId,
      minimum: Role.ENGINEER,
    });
    if (!access.ok) {
      return new Response(JSON.stringify({ message: access.message }), {
        status: access.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      typeof issueStatus !== "undefined" &&
      !canTransitionIssueStatus({ from: existing.status, to: issueStatus })
    ) {
      return new Response(JSON.stringify({ message: "Invalid status transition." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        title: issueTitle,
        description: issueDescription,
        priority: issuePriority,
        status: issueStatus,
        assignedUser:
          typeof assignedUser === "string"
            ? assignedUser || null
            : assignedUser === null
              ? null
              : undefined,
        parentIssueId:
          typeof parentIssueId === "string"
            ? parentIssueId || null
            : parentIssueId === null
              ? null
              : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        labels: Array.isArray(labels) ? labels : undefined,
      },
    });

    if (updatedIssue) {
      return new Response(JSON.stringify({ message: "Issue updated!" }));
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Error updating issue!" }));
  }
}
