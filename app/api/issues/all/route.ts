import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { accessibleProjectsWhere } from "@/lib/project-access";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { Prisma, TicketType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const ticketType = request.nextUrl.searchParams.get("ticketType");
  const projectId = request.nextUrl.searchParams.get("projectId");

  const accessibleProjects = await prisma.project.findMany({
    where: await accessibleProjectsWhere(session.user.id),
    select: { id: true },
  });
  const projectIds = accessibleProjects.map((p) => p.id);

  if (projectIds.length === 0) {
    return Response.json([]);
  }

  const where: Prisma.IssueWhereInput = {
    projectId: projectId && projectIds.includes(projectId) ? projectId : { in: projectIds },
  };

  if (status?.trim()) {
    where.status = status.trim();
  }

  if (
    ticketType &&
    Object.values(TicketType).includes(ticketType as TicketType)
  ) {
    where.ticketType = ticketType as TicketType;
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      User: {
        select: { id: true, name: true, email: true, image: true },
      },
      Project: {
        select: { id: true, title: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  return Response.json(issues);
}
