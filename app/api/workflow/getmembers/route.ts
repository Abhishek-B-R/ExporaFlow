import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { prisma } from "@/db";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

const ROLE_RANK: Record<Role, number> = {
  [Role.ADMIN]: 5,
  [Role.MANAGER]: 4,
  [Role.ENGINEER]: 3,
  [Role.QA]: 2,
  [Role.VIEWER]: 1,
  [Role.CUSTOMER]: 0,
};

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

  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  const workspaceIds = workspaceMemberships.map((m) => m.workspaceId);

  if (workspaceIds.length === 0) return Response.json([]);

  const rows = await prisma.workspaceMember.findMany({
    where: { workspaceId: { in: workspaceIds } },
    include: {
      workspace: { select: { id: true, name: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          employee: {
            select: {
              phoneNumber: true,
              designation: true,
              organizationAccess: true,
              team: { select: { id: true, name: true } },
            },
          },
          projectMembers: {
            select: {
              role: true,
              project: {
                select: {
                  id: true,
                  title: true,
                  workspaceId: true,
                },
              },
            },
          },
          serviceLineGrants: { select: { serviceLine: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  type WorkspaceSlice = { workspaceId: string; workspaceName: string; role: Role };
  type ProjectSlice = {
    id: string;
    title: string;
    role: Role;
    workspaceId: string | null;
  };

  const byUser = new Map<
    string,
    {
      userId: string;
      primaryWorkspaceMemberId: string;
      highestRole: Role;
      workspaces: WorkspaceSlice[];
      user: (typeof rows)[number]["user"];
      projectsById: Map<string, ProjectSlice>;
      serviceLines: Set<string>;
    }
  >();

  for (const wm of rows) {
    const uid = wm.userId;
    let agg = byUser.get(uid);
    if (!agg) {
      agg = {
        userId: uid,
        primaryWorkspaceMemberId: wm.id,
        highestRole: wm.role,
        workspaces: [],
        user: wm.user,
        projectsById: new Map(),
        serviceLines: new Set(),
      };
      byUser.set(uid, agg);
    }

    agg.workspaces.push({
      workspaceId: wm.workspaceId,
      workspaceName: wm.workspace.name,
      role: wm.role,
    });
    if (ROLE_RANK[wm.role] > ROLE_RANK[agg.highestRole]) {
      agg.highestRole = wm.role;
    }

    for (const pm of wm.user.projectMembers) {
      const wid = pm.project.workspaceId;
      if (wid == null || !workspaceIds.includes(wid)) continue;
      if (!agg.projectsById.has(pm.project.id)) {
        agg.projectsById.set(pm.project.id, {
          id: pm.project.id,
          title: pm.project.title,
          role: pm.role,
          workspaceId: pm.project.workspaceId,
        });
      }
    }

    for (const g of wm.user.serviceLineGrants) {
      agg.serviceLines.add(g.serviceLine);
    }
  }

  const payload = Array.from(byUser.values()).map((agg) => ({
    id: agg.primaryWorkspaceMemberId,
    userId: agg.userId,
    role: agg.highestRole,
    workspaces: agg.workspaces,
    user: {
      id: agg.user.id,
      name: agg.user.name,
      email: agg.user.email,
      image: agg.user.image,
    },
    employee: agg.user.employee,
    projects: Array.from(agg.projectsById.values()),
    serviceLines: Array.from(agg.serviceLines),
  }));

  return Response.json(payload);
}
