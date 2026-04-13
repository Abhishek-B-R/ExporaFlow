import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { assertProjectRole } from "@/lib/authz";
import { Prisma, Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { query, projectId } = await request.json();
  const searchQuery = typeof query === "string" ? query.trim() : "";
  if (!searchQuery) {
    return Response.json({ issues: [], projects: [] });
  }

  let allowedProjectIds: string[] = [];

  if (projectId) {
    const access = await assertProjectRole({
      userId: session.user.id,
      projectId,
      minimum: Role.VIEWER,
    });
    if (!access.ok) {
      return Response.json({ message: access.message }, { status: access.status });
    }
    allowedProjectIds = [projectId];
  } else {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { createdBy: session.user.id },
          { projectMembers: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true },
    });
    allowedProjectIds = projects.map((project) => project.id);
  }

  if (!allowedProjectIds.length) {
    return Response.json({ issues: [], projects: [] });
  }

  const tsQuery = Prisma.sql`plainto_tsquery('simple', ${searchQuery})`;
  const ids = Prisma.sql`ARRAY[${Prisma.join(allowedProjectIds)}]::text[]`;

  const issues = await prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      description: string | null;
      status: string | null;
      priority: string | null;
      projectId: string;
      projectTitle: string;
    }>
  >(Prisma.sql`
    SELECT
      i."id",
      i."title",
      i."description",
      i."status",
      i."priority",
      i."projectId",
      p."title" AS "projectTitle"
    FROM "Issue" i
    JOIN "Project" p ON p."id" = i."projectId"
    WHERE i."projectId" = ANY(${ids})
      AND to_tsvector('simple', COALESCE(i."title", '') || ' ' || COALESCE(i."description", '')) @@ ${tsQuery}
    ORDER BY i."updatedAt" DESC
    LIMIT 20
  `);

  const projects = await prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      description: string | null;
      status: string | null;
      priority: string | null;
    }>
  >(Prisma.sql`
    SELECT
      p."id",
      p."title",
      p."description",
      p."status",
      p."priority"
    FROM "Project" p
    WHERE p."id" = ANY(${ids})
      AND to_tsvector('simple', COALESCE(p."title", '') || ' ' || COALESCE(p."description", '') || ' ' || COALESCE(p."content", '')) @@ ${tsQuery}
    ORDER BY p."title" ASC
    LIMIT 20
  `);

  return Response.json({ issues, projects });
}
