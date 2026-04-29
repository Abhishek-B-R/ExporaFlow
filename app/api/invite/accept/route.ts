import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token || typeof token !== "string") {
    return Response.json({ message: "Invalid or missing token." }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invitation) {
    return Response.json({ message: "Invitation not found." }, { status: 404 });
  }

  if (invitation.status !== "pending") {
    return Response.json(
      { message: `This invitation has already been ${invitation.status}.` },
      { status: 410 },
    );
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "expired" },
    });
    return Response.json({ message: "This invitation has expired." }, { status: 410 });
  }

  // Require the accepting user to be logged in
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(
      { message: "Please sign in first to accept this invitation." },
      { status: 401 },
    );
  }

  // Verify the logged-in user's email matches the invitation
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });

  if (!user?.email || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return Response.json(
      {
        message: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
        expectedEmail: invitation.email,
      },
      { status: 403 },
    );
  }

  // Check if already a member
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: invitation.workspaceId },
  });

  if (existingMembership) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" },
    });
    return Response.json({
      message: "You are already a member of this workspace.",
      workspaceName: invitation.workspace.name,
      alreadyMember: true,
    });
  }

  // Accept: add user to workspace + mark invitation as accepted
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

  return Response.json({
    message: `You've joined "${invitation.workspace.name}" as ${invitation.role}.`,
    workspaceName: invitation.workspace.name,
    role: invitation.role,
  });
}
