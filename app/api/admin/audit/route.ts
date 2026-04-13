import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/db";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const [adminWorkspaceMemberships, adminProjectMemberships, createdProjects] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { userId: session.user.id, role: Role.ADMIN },
      select: { workspaceId: true },
    }),
    prisma.projectMember.findMany({
      where: { userId: session.user.id, role: Role.ADMIN },
      select: { projectId: true },
    }),
    prisma.project.findMany({
      where: { createdBy: session.user.id },
      select: { id: true },
    }),
  ]);

  const adminWorkspaceIds = adminWorkspaceMemberships.map((membership) => membership.workspaceId);
  const workspaceProjects =
    adminWorkspaceIds.length > 0
      ? await prisma.project.findMany({
          where: { workspaceId: { in: adminWorkspaceIds } },
          select: { id: true },
        })
      : [];

  const accessibleProjectIds = Array.from(
    new Set([
      ...workspaceProjects.map((project) => project.id),
      ...adminProjectMemberships.map((membership) => membership.projectId),
      ...createdProjects.map((project) => project.id),
    ]),
  );

  if (accessibleProjectIds.length === 0) {
    return Response.json({ message: "Admin access required." }, { status: 403 });
  }

  const logs = await prisma.issueActivity.findMany({
    where: {
      issue: { projectId: { in: accessibleProjectIds } },
    },
    include: {
      issue: { select: { id: true, title: true, projectId: true } },
      actor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return Response.json(logs);
}
