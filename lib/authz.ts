import { prisma } from "@/db";
import { Role } from "@prisma/client";
import { userPassesServiceLineForProject } from "@/lib/project-access";
import {
  canPerformProjectAction,
  type ProjectPermission,
} from "@/lib/rbac-permissions";

const ROLE_ORDER: Record<Role, number> = {
  ADMIN: 4,
  MANAGER: 3,
  ENGINEER: 2,
  QA: 1,
  VIEWER: 0,
  CUSTOMER: 0,
};

export function hasMinimumRole(params: { role: Role; minimum: Role }) {
  return ROLE_ORDER[params.role] >= ROLE_ORDER[params.minimum];
}

export async function getUserProjectRole(params: {
  userId: string;
  projectId: string;
}): Promise<Role | null> {
  const { userId, projectId } = params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdBy: true, workspaceId: true, serviceLine: true },
  });

  if (!project) return null;

  // 1. Project creator → ADMIN
  if (project.createdBy === userId) return Role.ADMIN;

  // 2. Direct project member → their assigned role
  const projectMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  if (projectMembership) return projectMembership.role;

  // 3. Workspace member → workspace role, with service-line scoping for non-elevated roles
  if (project.workspaceId) {
    const workspaceMembership = await prisma.workspaceMember.findFirst({
      where: { workspaceId: project.workspaceId, userId },
      select: { role: true },
    });
    if (workspaceMembership) {
      const elevated =
        workspaceMembership.role === Role.ADMIN ||
        workspaceMembership.role === Role.MANAGER;
      if (
        !elevated &&
        !(await userPassesServiceLineForProject({
          userId,
          serviceLine: project.serviceLine,
        }))
      ) {
        return null;
      }
      return workspaceMembership.role;
    }
  }

  return null;
}

export async function assertProjectRole(params: {
  userId: string;
  projectId: string;
  minimum: Role;
}) {
  const { userId, projectId, minimum } = params;
  const role = await getUserProjectRole({ userId, projectId });
  if (!role) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "Access denied.",
    };
  }
  if (!hasMinimumRole({ role, minimum })) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "Insufficient permissions.",
    };
  }
  return { ok: true as const, role };
}

export async function assertProjectPermission(params: {
  userId: string;
  projectId: string;
  permission: ProjectPermission;
}) {
  const { userId, projectId, permission } = params;
  const role = await getUserProjectRole({ userId, projectId });
  if (!role) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "Access denied.",
    };
  }
  if (!canPerformProjectAction(role, permission)) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "Insufficient permissions.",
    };
  }
  return { ok: true as const, role };
}
