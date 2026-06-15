import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertProjectRole, assertProjectPermission } from "@/lib/authz";
import { Role, TicketType, TicketUrgency } from "@prisma/client";
import { computeDueDateFromPolicy } from "@/lib/ticket-due-date-policy";
import { canTransitionIssueStatus } from "@/lib/issue-status-machine";
import { logIssueActivity, notifyUsers } from "@/lib/collaboration";
import { updateIssueBodySchema } from "@/lib/ticket-schemas";
import { canPerformProjectAction } from "@/lib/rbac-permissions";
import {
  buildHoldAndSlaPatch,
  computeInitialSlaDueAt,
  parseStoredDate,
} from "@/lib/ticket-sla";
import { isChangeManagementType } from "@/lib/ticket-types";
import {
  diffNewMentionIds,
  loadMentionCandidatesForProject,
} from "@/lib/mention-candidates";
import { queueMentionEmails } from "@/lib/mention-email";

export async function PATCH(request: NextRequest) {
  const raw = await request.json();
  const parsed = updateIssueBodySchema.safeParse(raw);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        message: parsed.error.errors[0]?.message ?? "Invalid request.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

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
    estimate,
    startDate,
    endDate,
    durationMinutes,
    ticketType,
    urgency,
    requesterName,
    requesterEmail,
    manualDueDateOverride,
  } = parsed.data;

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
        estimate: true,
        ticketType: true,
        startDate: true,
        endDate: true,
        durationMinutes: true,
        holdStartedAt: true,
        accumulatedHoldSeconds: true,
        slaDueAt: true,
        urgency: true,
        requesterName: true,
        requesterEmail: true,
        ticketNumber: true,
        globalTicketNumber: true,
        createdAt: true,
      },
    });

    if (!existing) {
      return new Response(JSON.stringify({ message: "Ticket not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const access = await assertProjectRole({
      userId: session.user.id,
      projectId: existing.projectId,
      minimum: Role.VIEWER,
    });
    if (!access.ok) {
      return new Response(JSON.stringify({ message: access.message }), {
        status: access.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = access.role;

    const forbidden = () =>
      new Response(
        JSON.stringify({ message: "Insufficient permissions for this change." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );

    if (
      typeof issueStatus === "string" &&
      issueStatus !== (existing.status ?? "") &&
      !canPerformProjectAction(role, "updateTicketStatus")
    ) {
      return forbidden();
    }
    if (
      typeof issuePriority === "string" &&
      issuePriority !== (existing.priority ?? "") &&
      !canPerformProjectAction(role, "updateTicketPriority")
    ) {
      return forbidden();
    }
    if (
      urgency !== undefined &&
      urgency !== (existing.urgency ?? TicketUrgency.MEDIUM) &&
      !canPerformProjectAction(role, "updateTicketPriority")
    ) {
      return forbidden();
    }
    if (
      (typeof assignedUser === "string" || assignedUser === null) &&
      (assignedUser || null) !== (existing.assignedUser || null) &&
      !canPerformProjectAction(role, "assignTicket")
    ) {
      return forbidden();
    }
    if (
      (typeof sprintId === "string" || sprintId === null) &&
      (sprintId || null) !== (existing.sprintId || null) &&
      !canPerformProjectAction(role, "manageSprints")
    ) {
      return forbidden();
    }

    const labelsChanging =
      Array.isArray(labels) &&
      labels.join(",") !== (existing.labels ?? []).join(",");
    const contentChanging =
      (typeof issueTitle === "string" && issueTitle !== existing.title) ||
      (typeof issueDescription === "string" &&
        issueDescription !== (existing.description ?? "")) ||
      labelsChanging ||
      (typeof estimate === "number" && estimate !== existing.estimate) ||
      (estimate === null && existing.estimate !== null) ||
      (requesterName !== undefined &&
        (requesterName?.trim() || null) !== (existing.requesterName ?? null)) ||
      (requesterEmail !== undefined &&
        (requesterEmail?.trim() || null) !== (existing.requesterEmail ?? null)) ||
      ((typeof parentIssueId === "string" || parentIssueId === null) &&
        (parentIssueId || null) !== (existing.parentIssueId || null)) ||
      (ticketType !== undefined && ticketType !== existing.ticketType) ||
      startDate !== undefined ||
      endDate !== undefined ||
      durationMinutes !== undefined;

    if (contentChanging && !canPerformProjectAction(role, "updateTicket")) {
      return forbidden();
    }

    const effectiveType = ticketType ?? existing.ticketType;

    if (
      typeof issueStatus !== "undefined" &&
      !canTransitionIssueStatus({
        from: existing.status,
        to: issueStatus,
        ticketType: effectiveType,
      })
    ) {
      return new Response(
        JSON.stringify({ message: "Invalid status transition." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const nextStart =
      startDate !== undefined
        ? parseStoredDate(typeof startDate === "string" ? startDate : undefined)
        : existing.startDate;
    const nextEnd =
      endDate !== undefined
        ? parseStoredDate(typeof endDate === "string" ? endDate : undefined)
        : existing.endDate;
    const nextDuration =
      durationMinutes !== undefined
        ? durationMinutes
        : existing.durationMinutes;

    if (isChangeManagementType(effectiveType)) {
      if (!nextStart) {
        return new Response(
          JSON.stringify({
            message: "Start date is required for change management tickets.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (!nextEnd && !nextDuration) {
        return new Response(
          JSON.stringify({
            message:
              "End date or duration is required for change management tickets.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    if (typeof sprintId !== "undefined" && sprintId !== null) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        select: { projectId: true },
      });
      if (!sprint || sprint.projectId !== existing.projectId) {
        return new Response(
          JSON.stringify({ message: "Invalid sprint for this project." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    const holdSlaPatch = buildHoldAndSlaPatch({
      existing: {
        ticketType: existing.ticketType,
        status: existing.status,
        holdStartedAt: existing.holdStartedAt,
        accumulatedHoldSeconds: existing.accumulatedHoldSeconds,
        slaDueAt: existing.slaDueAt,
      },
      nextStatus: issueStatus,
    });

    let nextSlaDueAt: Date | null | undefined = undefined;
    if (
      isChangeManagementType(effectiveType) &&
      (startDate !== undefined ||
        endDate !== undefined ||
        durationMinutes !== undefined)
    ) {
      nextSlaDueAt = computeInitialSlaDueAt({
        startDate: nextStart,
        endDate: nextEnd,
        durationMinutes: nextDuration,
      });
    }

    const nextUrgency =
      urgency !== undefined
        ? urgency
        : (existing.urgency ?? TicketUrgency.MEDIUM);
    const nextPriority =
      issuePriority !== undefined ? issuePriority : existing.priority;

    const priorityChanged =
      issuePriority !== undefined && issuePriority !== existing.priority;
    const urgencyChanged =
      urgency !== undefined && urgency !== existing.urgency;

    let resolvedDueDate: Date | null | undefined = undefined;
    const wantsManualDue =
      typeof dueDate !== "undefined" || manualDueDateOverride === true;

    if (wantsManualDue) {
      const overrideAccess = await assertProjectPermission({
        userId: session.user.id,
        projectId: existing.projectId,
        permission: "overrideDueDate",
      });
      if (!overrideAccess.ok) {
        return new Response(
          JSON.stringify({
            message: "Only managers can manually override due dates.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
      if (typeof dueDate === "string") {
        resolvedDueDate = dueDate ? parseStoredDate(dueDate) : null;
      } else if (dueDate === null) {
        resolvedDueDate = null;
      }
    } else if (
      !isChangeManagementType(effectiveType) &&
      (priorityChanged || urgencyChanged)
    ) {
      resolvedDueDate = computeDueDateFromPolicy({
        urgency: nextUrgency,
        priority: nextPriority,
        baseDate: existing.createdAt,
        ticketType: effectiveType,
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        title: issueTitle,
        description: issueDescription,
        priority: issuePriority,
        urgency,
        requesterName:
          requesterName !== undefined
            ? requesterName?.trim() || null
            : undefined,
        requesterEmail:
          requesterEmail !== undefined
            ? requesterEmail?.trim() || null
            : undefined,
        status: issueStatus,
        ticketType,
        startDate: startDate !== undefined ? nextStart : undefined,
        endDate: endDate !== undefined ? nextEnd : undefined,
        durationMinutes:
          durationMinutes !== undefined ? nextDuration : undefined,
        ...(nextSlaDueAt !== undefined ? { slaDueAt: nextSlaDueAt } : {}),
        ...holdSlaPatch,
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
        dueDate: resolvedDueDate,
        labels: Array.isArray(labels) ? labels : undefined,
        estimate:
          typeof estimate === "number"
            ? estimate
            : estimate === null
              ? null
              : undefined,
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
      if (
        typeof issueStatus === "string" &&
        issueStatus !== (existing.status ?? "")
      ) {
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
        const prev = existing.dueDate
          ? existing.dueDate.toISOString().slice(0, 10)
          : "";
        const next = dueDate
          ? new Date(dueDate).toISOString().slice(0, 10)
          : "";
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
            title: "You were assigned a ticket",
            body: updatedIssue.title,
            issueId: updatedIssue.id,
            projectId: updatedIssue.projectId,
          });
        }

        if (
          typeof issueDescription === "string" &&
          issueDescription !== (existing.description ?? "")
        ) {
          const candidates = await loadMentionCandidatesForProject(
            existing.projectId,
            session.user.id,
          );
          const mentionedUserIds = diffNewMentionIds({
            previousText: existing.description,
            nextText: issueDescription,
            candidates,
          });
          if (mentionedUserIds.length > 0) {
            queueMentionEmails({
              mentionedUserIds,
              actorId: session.user.id,
              issueId: updatedIssue.id,
              projectId: updatedIssue.projectId,
              issueTitle: updatedIssue.title,
              excerpt: issueDescription,
              ticketType: updatedIssue.ticketType,
              ticketNumber: existing.ticketNumber,
              globalTicketNumber: existing.globalTicketNumber,
              sourceType: "description_update",
              sourceId: updatedIssue.id,
            });
          }
        }
      } catch (sideEffectError) {
        console.error(
          "Non-fatal issue update side-effect failure:",
          sideEffectError,
        );
      }

      return new Response(JSON.stringify({ message: "Ticket updated!" }));
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Error updating ticket!" }));
  }
}
