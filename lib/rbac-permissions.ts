import { Role } from "@prisma/client";
import { hasMinimumRole } from "@/lib/authz";

/** Minimum project role required per action — adjust centrally here. */
export const PROJECT_PERMISSIONS = {
  viewTickets: Role.VIEWER,
  exportTickets: Role.VIEWER,
  comment: Role.VIEWER,
  /** Any workspace employee (Viewer+) may file tickets */
  createTicket: Role.VIEWER,
  /** Title, description, labels, requester text */
  updateTicket: Role.ENGINEER,
  /** Completed, working, backlog, etc. — managers and admins only */
  updateTicketStatus: Role.MANAGER,
  updateTicketPriority: Role.MANAGER,
  assignTicket: Role.MANAGER,
  uploadAttachment: Role.VIEWER,
  deleteTicket: Role.MANAGER,
  deleteAttachment: Role.MANAGER,
  manageSprints: Role.MANAGER,
  updateProject: Role.MANAGER,
  deleteProject: Role.ADMIN,
  inviteMembers: Role.ADMIN,
  overrideDueDate: Role.MANAGER,
  manageUsers: Role.ADMIN,
  exportAllTickets: Role.ADMIN,
  createProject: Role.MANAGER,
} as const;

export type ProjectPermission = keyof typeof PROJECT_PERMISSIONS;

/** Customer portal users — scoped to their linked customer projects. */
export const CUSTOMER_PERMISSIONS: Record<ProjectPermission, boolean> = {
  viewTickets: true,
  exportTickets: false,
  comment: true,
  createTicket: true,
  updateTicket: false,
  updateTicketStatus: false,
  updateTicketPriority: false,
  assignTicket: false,
  uploadAttachment: true,
  deleteTicket: false,
  deleteAttachment: false,
  manageSprints: false,
  updateProject: false,
  deleteProject: false,
  inviteMembers: false,
  overrideDueDate: false,
  manageUsers: false,
  exportAllTickets: false,
  createProject: false,
};

export function canPerformProjectAction(
  role: Role | null | undefined,
  permission: ProjectPermission,
): boolean {
  if (!role) return false;
  if (role === Role.CUSTOMER) {
    return CUSTOMER_PERMISSIONS[permission];
  }
  return hasMinimumRole({ role, minimum: PROJECT_PERMISSIONS[permission] });
}

export async function assertWorkspacePermission(
  userId: string,
  permission: ProjectPermission,
) {
  const access = await assertWorkspaceMember(userId);
  if (!access.ok) return access;
  if (!canPerformProjectAction(access.membership.role, permission)) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "Insufficient permissions.",
    };
  }
  return access;
}

export async function assertWorkspaceMember(userId: string) {
  const { isWorkspaceMember, getPrimaryWorkspaceId } = await import(
    "@/lib/workspace-access"
  );
  const { prisma } = await import("@/db");

  if (!(await isWorkspaceMember(userId))) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "You must belong to this workspace to perform this action.",
    };
  }

  const workspaceId = await getPrimaryWorkspaceId();
  const membership = await prisma.workspaceMember.findFirst({
    where: workspaceId ? { userId, workspaceId } : { userId },
    select: { id: true, role: true, workspaceId: true },
  });
  if (!membership) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "You must belong to this workspace to perform this action.",
    };
  }
  return { ok: true as const, membership };
}
