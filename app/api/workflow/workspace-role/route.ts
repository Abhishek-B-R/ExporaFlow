import { authOptions } from "@/lib/auth";
import { getPrimaryWorkspaceId } from "@/lib/workspace-access";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getPrimaryWorkspaceId();
  if (!workspaceId) {
    return Response.json({ role: null });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId },
    select: { role: true },
  });

  return Response.json({ role: membership?.role ?? null });
}
