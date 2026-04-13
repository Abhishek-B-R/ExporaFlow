import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";
import { canTransitionIssueStatus } from "@/lib/issue-status-machine";
import { logIssueActivity, notifyUsers } from "@/lib/collaboration";

export async function PATCH(request: NextRequest) {
  const {
    issueId,
    issueTitle,
    issueDescription,
    issuePriority,
    issueStatus,
    assignedUser,
    parentIssueId,
    sprintId,
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
      select: {
        projectId: true,
        status: true,
        title: true,
        description: true,
        priority: true,
        assignedUser: true,
        parentIssueId: true,
        sprintId: true,
        dueDate: true,
        labels: true,
      },
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

    if (typeof sprintId !== "undefined" && sprintId !== null) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        select: { projectId: true },
      });
      if (!sprint || sprint.projectId !== existing.projectId) {
        return new Response(JSON.stringify({ message: "Invalid sprint for this project." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
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
        sprintId:
          typeof sprintId === "string"
            ? sprintId || null
            : sprintId === null
              ? null
              : undefined,
        dueDate:
          typeof dueDate === "string"
            ? dueDate
              ? new Date(dueDate)
              : null
            : dueDate === null
              ? null
              : undefined,
        labels: Array.isArray(labels) ? labels : undefined,
      },
    });

    if (updatedIssue) {
      const changes: Array<{ field: string; from: string; to: string }> = [];

      if (typeof issueTitle === "string" && issueTitle !== existing.title) {
        changes.push({ field: "title", from: existing.title, to: issueTitle });
      }
      if (
        typeof issueDescription === "string" &&
        issueDescription !== (existing.description ?? "")
      ) {
        changes.push({
          field: "description",
          from: existing.description ?? "",
          to: issueDescription,
        });
      }
      if (typeof issueStatus === "string" && issueStatus !== (existing.status ?? "")) {
        changes.push({
          field: "status",
          from: existing.status ?? "",
          to: issueStatus,
        });
      }
      if (
        typeof issuePriority === "string" &&
        issuePriority !== (existing.priority ?? "")
      ) {
        changes.push({
          field: "priority",
          from: existing.priority ?? "",
          to: issuePriority,
        });
      }
      if (
        (typeof assignedUser === "string" || assignedUser === null) &&
        (assignedUser || null) !== (existing.assignedUser || null)
      ) {
        changes.push({
          field: "assignee",
          from: existing.assignedUser ?? "",
          to: assignedUser ?? "",
        });
      }
      if (
        (typeof parentIssueId === "string" || parentIssueId === null) &&
        (parentIssueId || null) !== (existing.parentIssueId || null)
      ) {
        changes.push({
          field: "parentIssue",
          from: existing.parentIssueId ?? "",
          to: parentIssueId ?? "",
        });
      }
      if (
        (typeof sprintId === "string" || sprintId === null) &&
        (sprintId || null) !== (existing.sprintId || null)
      ) {
        changes.push({
          field: "sprintId",
          from: existing.sprintId ?? "",
          to: sprintId ?? "",
        });
      }
      if (Array.isArray(labels)) {
        const previousLabels = (existing.labels ?? []).join(",");
        const nextLabels = labels.join(",");
        if (previousLabels !== nextLabels) {
          changes.push({
            field: "labels",
            from: previousLabels,
            to: nextLabels,
          });
        }
      }
      if (typeof dueDate !== "undefined") {
        const prev = existing.dueDate ? existing.dueDate.toISOString().slice(0, 10) : "";
        const next = dueDate ? new Date(dueDate).toISOString().slice(0, 10) : "";
        if (prev !== next) {
          changes.push({ field: "dueDate", from: prev, to: next });
        }
      }

      try {
        await Promise.all(
          changes.map((change) =>
            logIssueActivity({
              issueId,
              actorId: session.user.id,
              action: "ISSUE_UPDATED",
              field: change.field,
              fromValue: change.from,
              toValue: change.to,
            }),
          ),
        );

        if (
          (typeof assignedUser === "string" || assignedUser === null) &&
          assignedUser &&
          assignedUser !== existing.assignedUser
        ) {
          await notifyUsers({
            userIds: [assignedUser],
            actorId: session.user.id,
            type: "ISSUE_ASSIGNED",
            title: "You were assigned an issue",
            body: updatedIssue.title,
            issueId: updatedIssue.id,
            projectId: updatedIssue.projectId,
          });
        }
      } catch (sideEffectError) {
        console.error("Non-fatal issue update side-effect failure:", sideEffectError);
      }

      return new Response(JSON.stringify({ message: "Issue updated!" }));
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Error updating issue!" }));
  }
}
