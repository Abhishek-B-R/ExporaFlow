import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  // Find ALL workspaces the user belongs to
  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  const workspaceIds = workspaceMemberships.map((m) => m.workspaceId);

  if (workspaceIds.length === 0) return Response.json([]);

  const teams = await prisma.team.findMany({
    where: { workspaceId: { in: workspaceIds } },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(teams);
}
