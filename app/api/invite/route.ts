import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_your")) return null;
  return new Resend(key);
}

function getAppUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

const VALID_ROLES: Role[] = ["ADMIN", "MANAGER", "ENGINEER", "QA", "VIEWER"];

// ── POST: Send an invitation ──────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const body = await request.json();
  const email = (body.email ?? "").trim().toLowerCase();
  const role = (body.role ?? "ENGINEER") as Role;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ message: "A valid email address is required." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return Response.json({ message: "Invalid role." }, { status: 400 });
  }

  // Find the sender's workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true, role: true, workspace: { select: { name: true } } },
  });

  if (!membership) {
    return Response.json({ message: "You don't belong to any workspace." }, { status: 400 });
  }

  // Only ADMIN can invite
  if (membership.role !== "ADMIN") {
    return Response.json({ message: "Only workspace admins can invite members." }, { status: 403 });
  }

  // Check if user is already a workspace member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const alreadyMember = await prisma.workspaceMember.findFirst({
      where: { userId: existingUser.id, workspaceId: membership.workspaceId },
    });
    if (alreadyMember) {
      return Response.json({ message: "This user is already a workspace member." }, { status: 409 });
    }
  }

  // Check for existing pending invitation
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      email,
      workspaceId: membership.workspaceId,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    return Response.json({ message: "An invitation for this email is already pending." }, { status: 409 });
  }

  // Create the invitation
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      email,
      token,
      role,
      expiresAt,
      workspaceId: membership.workspaceId,
      invitedById: session.user.id,
    },
  });

  // Send the email via Resend
  const resend = getResend();
  const appUrl = getAppUrl();
  const inviteLink = `${appUrl}/invite/accept?token=${token}`;
  const workspaceName = membership.workspace.name;
  const senderName = session.user.name ?? session.user.email ?? "A teammate";

  let emailSent = false;
  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "ExporaFlow <onboarding@resend.dev>",
        to: [email],
        subject: `${senderName} invited you to join "${workspaceName}" on ExporaFlow`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto;">
            <div style="padding: 32px 24px; background: #0f1111; border-radius: 12px; border: 1px solid #393b42;">
              <h1 style="margin: 0 0 8px; font-size: 22px; color: #ffffff; font-weight: 600;">
                You're invited to ${workspaceName}
              </h1>
              <p style="margin: 0 0 24px; color: #a4a6aa; font-size: 14px; line-height: 1.6;">
                <strong style="color: #caccd4;">${senderName}</strong> has invited you to collaborate on
                <strong style="color: #caccd4;">${workspaceName}</strong> as a <strong style="color: #6f86ff;">${role}</strong>.
              </p>
              <a href="${inviteLink}"
                 style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #6f86ff, #7c5cff);
                        color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                Accept Invitation
              </a>
              <p style="margin: 24px 0 0; color: #6a6c75; font-size: 12px; line-height: 1.5;">
                This invitation expires in 7 days.<br/>
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${inviteLink}" style="color: #6f86ff; word-break: break-all;">${inviteLink}</a>
              </p>
            </div>
            <p style="margin: 16px 0 0; color: #6a6c75; font-size: 11px; text-align: center;">
              Sent by ExporaFlow
            </p>
          </div>
        `,
      });
      emailSent = true;
    } catch (error) {
      console.error("Failed to send invite email:", error);
    }
  }

  return Response.json({
    message: emailSent
      ? `Invitation sent to ${email}`
      : `Invitation created for ${email} but email could not be sent. Share this link manually: ${inviteLink}`,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    },
    inviteLink: emailSent ? undefined : inviteLink,
    emailSent,
  });
}

// ── GET: List pending invitations for the workspace ──────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  if (!membership) return Response.json([]);

  const invitations = await prisma.invitation.findMany({
    where: { workspaceId: membership.workspaceId },
    include: {
      invitedBy: { select: { name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(invitations);
}
