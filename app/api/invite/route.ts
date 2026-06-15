import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getPrimaryWorkspaceId, isWorkspaceOwnerEmail } from "@/lib/workspace-access";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { Prisma, Role } from "@prisma/client";
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

const VALID_ROLES: Role[] = ["MANAGER", "ENGINEER", "QA", "VIEWER"];

// ── POST: Send an invitation ──────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const body = await request.json();
  const email = (body.email ?? "").trim().toLowerCase();
  const role = (body.role ?? "ENGINEER") as Role;
  const isActive = body.isActive !== false;
  const fullName =
    typeof body.fullName === "string" && body.fullName.trim()
      ? body.fullName.trim()
      : email.split("@")[0] ?? email;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ message: "A valid email address is required." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return Response.json({ message: "Invalid role." }, { status: 400 });
  }

  // Find the sender's membership in the primary workspace
  const workspaceId = await getPrimaryWorkspaceId();
  if (!workspaceId) {
    return Response.json({ message: "Workspace is not set up yet." }, { status: 400 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
    select: { workspaceId: true, role: true, workspace: { select: { name: true } } },
  });

  if (!membership) {
    return Response.json({ message: "You don't belong to any workspace." }, { status: 400 });
  }

  // Only the workspace owner can invite new people
  if (!isWorkspaceOwnerEmail(session.user.email)) {
    return Response.json(
      { message: "Only the workspace owner can invite people." },
      { status: 403 },
    );
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

  const existingEmployee = await prisma.employee.findUnique({
    where: { email },
  });
  if (existingEmployee) {
    await prisma.employee.update({
      where: { id: existingEmployee.id },
      data: {
        role,
        isActive,
        userId: existingUser?.id ?? existingEmployee.userId,
        organizationAccess: Array.isArray(existingEmployee.organizationAccess)
          ? ([
              ...new Set([
                ...(existingEmployee.organizationAccess as string[]),
                membership.workspaceId,
              ]),
            ] as Prisma.InputJsonValue)
          : ([membership.workspaceId] as Prisma.InputJsonValue),
      },
    });
  } else {
    await prisma.employee.create({
      data: {
        fullName,
        email,
        role,
        isActive,
        userId: existingUser?.id ?? null,
        organizationAccess: [membership.workspaceId] as Prisma.InputJsonValue,
      },
    });
  }

  // Send the email via Resend
  const resend = getResend();
  const appUrl = getAppUrl();
  const inviteLink = `${appUrl}/invite/join?token=${token}`;
  const workspaceName = membership.workspace.name;
  const senderName = session.user.name ?? session.user.email ?? "A teammate";

  let emailSent = false;
  let emailError = "";
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "ExporaFlow <onboarding@resend.dev>",
        to: [email],
        subject: `You're invited to ${workspaceName} on ExporaFlow`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
              <tr>
                <td align="center">
                  <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid rgba(15,23,42,0.08);overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
                    <tr>
                      <td style="padding:32px 28px 8px;text-align:center;">
                        <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#0ea5e9,#0284c7);line-height:48px;color:#fff;font-weight:700;font-size:20px;">E</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 28px 0;text-align:center;">
                        <h1 style="margin:0;font-size:22px;font-weight:600;color:#0f172a;letter-spacing:-0.02em;">You're invited</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 28px 24px;text-align:center;">
                        <p style="margin:0;font-size:15px;line-height:1.6;color:#64748b;">
                          <strong style="color:#0369a1;">${senderName}</strong> added you to
                          <strong style="color:#0f172a;">${workspaceName}</strong> as
                          <strong style="color:#0284c7;">${role}</strong>.
                        </p>
                        <p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#94a3b8;">
                          One click — no password, no Google sign-in. Your invite link signs you in automatically.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 28px;text-align:center;">
                        <a href="${inviteLink}"
                           style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;box-shadow:0 2px 8px rgba(2,132,199,0.35);">
                          Join workspace →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 28px 28px;">
                        <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">
                          Link expires in 7 days.<br/>
                          <a href="${inviteLink}" style="color:#0284c7;word-break:break-all;">${inviteLink}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:20px 0 0;font-size:11px;color:#94a3b8;text-align:center;">ExporaFlow · Incident & change management</p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
      // Resend returns { data, error }
      if (result.error) {
        console.error("Resend API error:", result.error);
        emailError = result.error.message ?? "Resend rejected the request.";
      } else {
        emailSent = true;
      }
    } catch (error) {
      console.error("Failed to send invite email:", error);
      emailError = error instanceof Error ? error.message : "Unknown email error.";
    }
  } else {
    emailError = "RESEND_API_KEY is not configured.";
  }

  return Response.json({
    message: emailSent
      ? `Invitation sent to ${email}`
      : `Invitation created for ${email} but email could not be sent. Share this link manually.`,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    },
    inviteLink: emailSent ? undefined : inviteLink,
    emailSent,
    emailError: emailSent ? undefined : emailError,
  });
}

// ── GET: List pending invitations for the workspace ──────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const workspaceId = await getPrimaryWorkspaceId();
  if (!workspaceId) return Response.json([]);

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
    select: { workspaceId: true },
  });

  if (!membership) return Response.json([]);

  const invitations = await prisma.invitation.findMany({
    where: { workspaceId },
    include: {
      invitedBy: { select: { name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(invitations);
}
