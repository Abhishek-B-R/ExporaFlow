import { Role } from "@prisma/client";
import { hasMinimumRole } from "@/lib/authz";

/** Minimum project role required per action — adjust centrally here. */
export const PROJECT_PERMISSIONS = {
  viewTickets: Role.VIEWER,
  exportTickets: Role.VIEWER,
  comment: Role.VIEWER,
  createTicket: Role.ENGINEER,
  updateTicket: Role.ENGINEER,
  uploadAttachment: Role.ENGINEER,
  deleteTicket: Role.MANAGER,
  deleteAttachment: Role.MANAGER,
  manageSprints: Role.MANAGER,
  updateProject: Role.MANAGER,
  deleteProject: Role.ADMIN,
  inviteMembers: Role.ADMIN,
  overrideDueDate: Role.MANAGER,
  manageUsers: Role.ADMIN,
  exportAllTickets: Role.ADMIN,
} as const;

export type ProjectPermission = keyof typeof PROJECT_PERMISSIONS;

/** Customer portal users — scoped to their linked customer projects. */
export const CUSTOMER_PERMISSIONS: Record<ProjectPermission, boolean> = {
  viewTickets: true,
  exportTickets: false,
  comment: true,
  createTicket: true,
  updateTicket: false,
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

export async function assertWorkspaceMember(userId: string) {
  const { prisma } = await import("@/db");
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { id: true, role: true, workspaceId: true },
  });
  if (!membership) {
    return {
      ok: false as const,
      status: 403 as const,
      message: "You must belong to a workspace to perform this action.",
    };
  }
  return { ok: true as const, membership };
}
