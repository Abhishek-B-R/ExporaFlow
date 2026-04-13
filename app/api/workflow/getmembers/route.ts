import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { prisma } from "@/db";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");

  if (projectId) {
    const access = await assertProjectRole({
      userId: session.user.id,
      projectId,
      minimum: Role.VIEWER,
    });
    if (!access.ok) {
      return Response.json({ message: access.message }, { status: access.status });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        creator: { select: { id: true, name: true, email: true, image: true } },
        projectMembers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!project) {
      return Response.json({ message: "Project not found." }, { status: 404 });
    }

    const byUserId = new Map<
      string,
      { id: string; user: { id: string; name?: string | null; email?: string | null; image?: string | null } }
    >();
    byUserId.set(project.creator.id, {
      id: `creator-${project.creator.id}`,
      user: project.creator,
    });
    for (const member of project.projectMembers) {
      byUserId.set(member.user.id, {
        id: member.id,
        user: member.user,
      });
    }
    return Response.json(Array.from(byUserId.values()));
  }

  const userWorkspaceMembership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  if (!userWorkspaceMembership) return Response.json([]);

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: userWorkspaceMembership.workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(members);
}

