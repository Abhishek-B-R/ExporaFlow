import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const userID = session.user.id;

  // Find ALL workspaces the user belongs to
  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: { userId: userID },
    select: { workspaceId: true },
  });
  const workspaceIds = workspaceMemberships.map((m) => m.workspaceId);

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        // Projects the user created
        { createdBy: userID },
        // Projects where user is a direct member
        { projectMembers: { some: { userId: userID } } },
        // Projects belonging to any workspace the user is a member of
        ...(workspaceIds.length > 0
          ? [{ workspaceId: { in: workspaceIds } }]
          : []),
      ],
    },
    orderBy: { title: "asc" },
  });

  return Response.json(projects);
}
