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
} as const;

export type ProjectPermission = keyof typeof PROJECT_PERMISSIONS;

export function canPerformProjectAction(
  role: Role | null | undefined,
  permission: ProjectPermission,
): boolean {
  if (!role) return false;
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
