import type { Prisma } from "@prisma/client";
import { prisma } from "@/db";
import { ProjectServiceLine, Role } from "@prisma/client";

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

export async function accessibleProjectsWhere(
  userId: string,
): Promise<Prisma.ProjectWhereInput> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true, role: true },
  });
  const workspaceById = new Map<string, Role>();
  for (const m of memberships) {
    const prev = workspaceById.get(m.workspaceId);
    const rank = (r: Role) =>
      (({ ADMIN: 4, MANAGER: 3, ENGINEER: 2, QA: 1, VIEWER: 0, CUSTOMER: 0 }) as const)[r];
    if (!prev || rank(m.role) > rank(prev))
      workspaceById.set(m.workspaceId, m.role);
  }

  const grants = await prisma.userServiceLineGrant.findMany({
    where: { userId },
    select: { serviceLine: true },
  });
  const grantLines = [...new Set(grants.map((g) => g.serviceLine))];

  const or: Prisma.ProjectWhereInput[] = [
    { createdBy: userId },
    { projectMembers: { some: { userId } } },
  ];

  for (const [workspaceId, role] of workspaceById) {
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
  }

  return { OR: or };
}
