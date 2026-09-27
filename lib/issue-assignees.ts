import { prisma } from "@/db";

/**
 * Multi-assignee helpers.
 *
 * A ticket has one *primary owner* (`Issue.assignedUser`) and a full assignee
 * list (`IssueAssignee`). The primary is always a member of the list, so every
 * existing query that reads `assignedUser` keeps working unchanged.
 */

export type ResolvedAssignees = {
  /** Deduped, membership-checked assignee ids, primary first. */
  assigneeIds: string[];
  /** The accountable owner, mirrored onto Issue.assignedUser. */
  primaryId: string | null;
};

/**
 * Narrow a requested assignee list to users who can actually hold a ticket on
 * this project, then order it so the primary owner comes first.
 *
 * Silently dropping unknown ids (rather than erroring) keeps the UI forgiving
 * when a member is removed from the project while someone has the form open.
 */
export async function resolveAssignees(params: {
  projectId: string;
  /** Requested list. `undefined` means "caller did not touch assignees". */
  requestedIds?: string[];
  /** Explicit primary from the caller, if any. */
  preferredPrimaryId?: string | null;
}): Promise<ResolvedAssignees> {
  const { projectId, requestedIds, preferredPrimaryId } = params;

  const candidateIds = Array.from(
    new Set(
      [...(requestedIds ?? []), ...(preferredPrimaryId ? [preferredPrimaryId] : [])]
        .map((id) => id?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (candidateIds.length === 0) {
    return { assigneeIds: [], primaryId: null };
  }

  // Only people attached to the project (directly, or through its workspace)
  // may be assigned.
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true },
  });

  const allowed = await prisma.user.findMany({
    where: {
      id: { in: candidateIds },
      OR: [
        { projectMembers: { some: { projectId } } },
        ...(project?.workspaceId
          ? [{ workspaceMembers: { some: { workspaceId: project.workspaceId } } }]
          : []),
      ],
    },
    select: { id: true },
  });

  const allowedIds = new Set(allowed.map((user) => user.id));
  const ordered = candidateIds.filter((id) => allowedIds.has(id));

  if (ordered.length === 0) {
    return { assigneeIds: [], primaryId: null };
  }

  const primaryId =
    preferredPrimaryId && allowedIds.has(preferredPrimaryId)
      ? preferredPrimaryId
      : ordered[0];

  return {
    assigneeIds: [primaryId, ...ordered.filter((id) => id !== primaryId)],
    primaryId,
  };
}

/**
 * Make the stored assignee rows match `assigneeIds` exactly.
 *
 * Diffs rather than delete-all-then-insert so `assignedAt` survives for people
 * who stay on the ticket. Safe to call inside a transaction.
 */
export async function syncIssueAssignees(params: {
  issueId: string;
  assigneeIds: string[];
  tx?: Pick<typeof prisma, "issueAssignee">;
}) {
  const { issueId, assigneeIds } = params;
  const client = params.tx ?? prisma;

  const existing = await client.issueAssignee.findMany({
    where: { issueId },
    select: { userId: true },
  });

  const existingIds = new Set(existing.map((row) => row.userId));
  const nextIds = new Set(assigneeIds);

  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
  const toAdd = assigneeIds.filter((id) => !existingIds.has(id));

  if (toRemove.length > 0) {
    await client.issueAssignee.deleteMany({
      where: { issueId, userId: { in: toRemove } },
    });
  }

  if (toAdd.length > 0) {
    await client.issueAssignee.createMany({
      data: toAdd.map((userId) => ({ issueId, userId })),
      skipDuplicates: true,
    });
  }

  return { added: toAdd, removed: toRemove };
}

/** Prisma `include` fragment for reading assignees with their user records. */
export const assigneesInclude = {
  assignees: {
    select: {
      userId: true,
      assignedAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { assignedAt: "asc" },
  },
} as const;
