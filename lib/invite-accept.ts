import { prisma } from "@/db";
import { defaultUsername } from "@/lib/default-username";
import { getPendingInvitationForEmail } from "@/lib/workspace-access";
import { Prisma, Role } from "@prisma/client";

export type InviteAcceptSuccess = {
  ok: true;
  user: { id: string; email: string; name: string | null };
  workspaceName: string;
  role: Role;
  alreadyMember: boolean;
};

export type InviteAcceptFailure = {
  ok: false;
  message: string;
  status: 400 | 404 | 410 | 403;
};

export type InviteAcceptResult = InviteAcceptSuccess | InviteAcceptFailure;

async function linkEmployeeToUser(params: {
  email: string;
  userId: string;
  role: Role;
  workspaceId: string;
  fullName: string;
}) {
  const { email, userId, role, workspaceId, fullName } = params;
  const existingEmployee = await prisma.employee.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingEmployee) {
    await prisma.employee.update({
      where: { id: existingEmployee.id },
      data: {
        userId,
        role,
        organizationAccess: Array.isArray(existingEmployee.organizationAccess)
          ? ([
              ...new Set([
                ...(existingEmployee.organizationAccess as string[]),
                workspaceId,
              ]),
            ] as Prisma.InputJsonValue)
          : ([workspaceId] as Prisma.InputJsonValue),
      },
    });
    return;
  }

  await prisma.employee.create({
    data: {
      fullName,
      email: email.toLowerCase(),
      role,
      userId,
      organizationAccess: [workspaceId] as Prisma.InputJsonValue,
    },
  });
}

/**
 * Validates an invite token, ensures a User exists for the invited email,
 * adds workspace membership, and marks the invitation accepted.
 */
export async function acceptInvitationByMagicToken(
  token: string,
): Promise<InviteAcceptResult> {
  if (!token || typeof token !== "string") {
    return { ok: false, message: "Invalid or missing token.", status: 400 };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true } },
    },
  });

  if (!invitation) {
    return { ok: false, message: "Invitation not found.", status: 404 };
  }

  if (new Date() > invitation.expiresAt) {
    if (invitation.status === "pending") {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });
    }
    return { ok: false, message: "This invitation has expired.", status: 410 };
  }

  const email = invitation.email.toLowerCase();
  const employee = await prisma.employee.findUnique({
    where: { email },
    select: { fullName: true },
  });
  const displayName =
    employee?.fullName?.trim() || email.split("@")[0] || email;

  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, username: true },
  });

  if (!user) {
    const created = await prisma.user.create({
      data: {
        email,
        name: displayName,
        emailVerified: new Date(),
      },
      select: { id: true, email: true, name: true, username: true },
    });
    await prisma.user.update({
      where: { id: created.id },
      data: {
        username: defaultUsername({
          id: created.id,
          email: created.email,
          name: created.name,
        }),
      },
    });
    user = created;
  }

  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: invitation.workspaceId },
  });

  if (existingMembership) {
    if (invitation.status === "pending") {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });
    }
    await linkEmployeeToUser({
      email,
      userId: user.id,
      role: invitation.role,
      workspaceId: invitation.workspaceId,
      fullName: displayName,
    });
    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email!,
        name: user.name,
      },
      workspaceName: invitation.workspace.name,
      role: invitation.role,
      alreadyMember: true,
    };
  }

  if (invitation.status !== "pending") {
    return {
      ok: false,
      message: `This invitation has already been ${invitation.status}.`,
      status: 410,
    };
  }

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" },
    }),
  ]);

  await linkEmployeeToUser({
    email,
    userId: user.id,
    role: invitation.role,
    workspaceId: invitation.workspaceId,
    fullName: displayName,
  });

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email!,
      name: user.name,
    },
    workspaceName: invitation.workspace.name,
    role: invitation.role,
    alreadyMember: false,
  };
}

/** Accept a pending invite for an existing user (e.g. email/password signup). */
export async function completeWorkspaceJoinForEmail(
  userId: string,
  email: string,
): Promise<void> {
  const normalized = email.trim().toLowerCase();

  const pending = await getPendingInvitationForEmail(normalized);
  if (!pending) return;

  const invitation = await prisma.invitation.findUnique({
    where: { id: pending.id },
    include: { workspace: { select: { id: true, name: true } } },
  });
  if (!invitation || invitation.status !== "pending") return;
  if (new Date() > invitation.expiresAt) return;

  const employee = await prisma.employee.findUnique({
    where: { email: normalized },
    select: { fullName: true },
  });
  const displayName =
    employee?.fullName?.trim() || normalized.split("@")[0] || normalized;

  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId: invitation.workspaceId },
  });

  if (existingMembership) {
    if (invitation.status === "pending") {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });
    }
    await linkEmployeeToUser({
      email: normalized,
      userId,
      role: invitation.role,
      workspaceId: invitation.workspaceId,
      fullName: displayName,
    });
    return;
  }

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" },
    }),
  ]);

  await linkEmployeeToUser({
    email: normalized,
    userId,
    role: invitation.role,
    workspaceId: invitation.workspaceId,
    fullName: displayName,
  });
}
