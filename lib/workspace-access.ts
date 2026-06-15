import { prisma } from "@/db";
import { Role } from "@prisma/client";

const DEFAULT_WORKSPACE_OWNER_EMAIL = "abhishekbr989@gmail.com";

export function getWorkspaceOwnerEmail(): string | null {
  const raw =
    process.env.WORKSPACE_OWNER_EMAIL?.trim().toLowerCase() ||
    DEFAULT_WORKSPACE_OWNER_EMAIL;
  return raw || null;
}

export function isWorkspaceOwnerEmail(email: string | null | undefined): boolean {
  const owner = getWorkspaceOwnerEmail();
  if (!owner || !email) return false;
  return email.trim().toLowerCase() === owner;
}

/** The workspace owned by WORKSPACE_OWNER_EMAIL (first membership). */
export async function getPrimaryWorkspaceId(): Promise<string | null> {
  const ownerEmail = getWorkspaceOwnerEmail();
  if (!ownerEmail) return null;

  const owner = await prisma.user.findFirst({
    where: { email: { equals: ownerEmail, mode: "insensitive" } },
    select: { id: true },
  });
  if (!owner) return null;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: owner.id },
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.workspaceId ?? null;
}

export async function isWorkspaceMember(userId: string): Promise<boolean> {
  const workspaceId = await getPrimaryWorkspaceId();
  if (!workspaceId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return isWorkspaceOwnerEmail(user?.email);
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });
  return !!membership;
}

export async function getPendingInvitationForEmail(email: string) {
  const workspaceId = await getPrimaryWorkspaceId();
  return prisma.invitation.findFirst({
    where: {
      email: { equals: email.trim(), mode: "insensitive" },
      status: "pending",
      expiresAt: { gt: new Date() },
      ...(workspaceId ? { workspaceId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export type WorkspaceAccess =
  | { kind: "member" }
  | { kind: "pending"; token: string }
  | { kind: "denied" };

/** Whether the user may use the app, has a pending invite, or should be turned away. */
export async function resolveWorkspaceAccess(
  userId: string,
  email?: string | null,
): Promise<WorkspaceAccess> {
  if (await isWorkspaceMember(userId)) {
    return { kind: "member" };
  }

  if (email) {
    const pending = await getPendingInvitationForEmail(email);
    if (pending) {
      return { kind: "pending", token: pending.token };
    }
  }

  return { kind: "denied" };
}

/** Gate OAuth sign-in: owner, existing member, or valid pending invite only. */
export async function canEmailSignIn(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  if (isWorkspaceOwnerEmail(normalized)) return true;

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingUser && (await isWorkspaceMember(existingUser.id))) return true;

  const pending = await getPendingInvitationForEmail(normalized);
  return !!pending;
}

/** Ensure the owner account has an ADMIN workspace (first sign-in / recovery). */
export async function ensureOwnerWorkspace(userId: string, displayName?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!isWorkspaceOwnerEmail(user?.email)) return;

  const existing = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { id: true, workspaceId: true, role: true },
  });

  if (existing) {
    if (existing.role !== Role.ADMIN) {
      await prisma.workspaceMember.update({
        where: { id: existing.id },
        data: { role: Role.ADMIN },
      });
    }
    return;
  }

  const workspaceName =
    (displayName?.split(" ")[0] ? `${displayName.split(" ")[0]}'s Workspace` : null) ??
    "ExporaFlow Workspace";

  await prisma.workspace.create({
    data: {
      name: workspaceName,
      members: {
        create: { userId, role: Role.ADMIN },
      },
      teams: {
        create: {
          name: "Core Team",
          members: { create: { userId, role: Role.ADMIN } },
        },
      },
    },
  });
}
