import { prisma } from "@/db";
import { defaultUsername } from "@/lib/default-username";
import { completeWorkspaceJoinForEmail } from "@/lib/invite-accept";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  canEmailSignIn,
  ensureOwnerWorkspace,
  isWorkspaceOwnerEmail,
  isWorkspaceMember,
} from "@/lib/workspace-access";

export type AuthResult =
  | { ok: true; userId: string; redirectUrl: string }
  | { ok: false; message: string; status: 400 | 401 | 403 | 409 };

export async function registerWithPassword(params: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();

  if (!(await canEmailSignIn(email))) {
    return {
      ok: false,
      status: 403,
      message:
        "This email is not invited. Ask your admin for an invite, or use the link in your invite email.",
    };
  }

  const passwordHash = await hashPassword(params.password);
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, name: true },
  });

  if (existing?.passwordHash) {
    return {
      ok: false,
      status: 409,
      message: "An account with this email already exists. Sign in instead.",
    };
  }

  let userId: string;

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        name: name || existing.name,
        emailVerified: new Date(),
      },
      select: { id: true },
    });
    userId = updated.id;
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        emailVerified: new Date(),
      },
      select: { id: true, email: true, name: true },
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
    userId = created.id;
  }

  await completeWorkspaceJoinForEmail(userId, email);

  if (isWorkspaceOwnerEmail(email)) {
    await ensureOwnerWorkspace(userId, name);
  }

  if (!(await isWorkspaceMember(userId)) && !isWorkspaceOwnerEmail(email)) {
    return {
      ok: false,
      status: 403,
      message:
        "Your invite may have expired. Ask your admin to send a new invitation.",
    };
  }

  return {
    ok: true,
    userId,
    redirectUrl: "/workflow/dashboard",
  };
}

export async function loginWithPassword(params: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = params.email.trim().toLowerCase();

  if (!(await canEmailSignIn(email))) {
    return {
      ok: false,
      status: 403,
      message:
        "This email is not invited. Use your invite link or ask the workspace admin for access.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, name: true },
  });

  if (!user) {
    return {
      ok: false,
      status: 401,
      message: "Incorrect email or password.",
    };
  }

  if (!user.passwordHash) {
    const hasOAuth = await prisma.account.findFirst({
      where: { userId: user.id },
      select: { provider: true },
    });
    if (hasOAuth) {
      return {
        ok: false,
        status: 401,
        message: "This account uses Google or GitHub. Continue with those options below.",
      };
    }
    return {
      ok: false,
      status: 401,
      message: "No password set for this email. Create an account on the sign-up page first.",
    };
  }

  const valid = await verifyPassword(params.password, user.passwordHash);
  if (!valid) {
    return {
      ok: false,
      status: 401,
      message: "Incorrect email or password.",
    };
  }

  await completeWorkspaceJoinForEmail(user.id, email);

  if (isWorkspaceOwnerEmail(email)) {
    await ensureOwnerWorkspace(user.id, user.name);
  }

  if (!(await isWorkspaceMember(user.id)) && !isWorkspaceOwnerEmail(email)) {
    return {
      ok: false,
      status: 403,
      message:
        "Your workspace access is not active. Open your invite email link or contact the admin.",
    };
  }

  return {
    ok: true,
    userId: user.id,
    redirectUrl: "/workflow/dashboard",
  };
}
