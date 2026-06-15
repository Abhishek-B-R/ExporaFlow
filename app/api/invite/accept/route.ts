import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { acceptInvitationByMagicToken } from "@/lib/invite-accept";
import { createDatabaseSession } from "@/lib/auth-session";

/** Accept invite for an already signed-in user (OAuth), or via JSON body. */
export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token || typeof token !== "string") {
    return Response.json({ message: "Invalid or missing token." }, { status: 400 });
  }

  const result = await acceptInvitationByMagicToken(token);
  if (!result.ok) {
    return Response.json({ message: result.message }, { status: result.status });
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const userEmail = session.user.email?.toLowerCase();
    if (userEmail && userEmail !== result.user.email.toLowerCase()) {
      return Response.json(
        {
          message: `This invitation was sent to ${result.user.email}. Sign out and open your invite link again.`,
          expectedEmail: result.user.email,
        },
        { status: 403 },
      );
    }
  } else {
    await createDatabaseSession(result.user.id);
  }

  return Response.json({
    message: result.alreadyMember
      ? "You are already a member of this workspace."
      : `You've joined "${result.workspaceName}" as ${result.role}.`,
    workspaceName: result.workspaceName,
    role: result.role,
    alreadyMember: result.alreadyMember,
  });
}
