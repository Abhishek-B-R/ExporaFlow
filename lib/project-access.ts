import type { Prisma } from "@prisma/client";
import { prisma } from "@/db";
import { ProjectServiceLine, Role } from "@prisma/client";
import { getPrimaryWorkspaceId } from "@/lib/workspace-access";

/**
 * When a user has explicit service-line grants, workspace-wide discovery is limited
 * to projects in those lines (unless workspace ADMIN/MANAGER).
 */
export async function userPassesServiceLineForProject(params: {
  userId: string;
  serviceLine: ProjectServiceLine | null;
}): Promise<boolean> {
  const { userId, serviceLine } = params;
  if (!serviceLine) return true;
  const grants = await prisma.userServiceLineGrant.findMany({
    where: { userId },
    select: { serviceLine: true },
  });
  if (grants.length === 0) return true;
  return grants.some((g) => g.serviceLine === serviceLine);
}

const NO_ACCESS: Prisma.ProjectWhereInput = { id: { in: [] } };

export async function accessibleProjectsWhere(
  userId: string,
): Promise<Prisma.ProjectWhereInput> {
  const workspaceId = await getPrimaryWorkspaceId();
  if (!workspaceId) return NO_ACCESS;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
    select: { role: true },
  });
  if (!membership) return NO_ACCESS;

  const role = membership.role;
  const grants = await prisma.userServiceLineGrant.findMany({
    where: { userId },
    select: { serviceLine: true },
  });
  const grantLines = [...new Set(grants.map((g) => g.serviceLine))];

  const or: Prisma.ProjectWhereInput[] = [
    { workspaceId, createdBy: userId },
    { workspaceId, projectMembers: { some: { userId } } },
  ];

  const elevated = role === Role.ADMIN || role === Role.MANAGER;
  if (elevated) {
    or.push({ workspaceId });
  } else if (grantLines.length > 0) {
    or.push({
      AND: [
        { workspaceId },
        {
          OR: [{ serviceLine: null }, { serviceLine: { in: grantLines } }],
        },
      ],
    });
  } else {
    or.push({ workspaceId });
  }

  return { OR: or };
}
