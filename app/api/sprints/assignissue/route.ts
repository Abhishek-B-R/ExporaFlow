import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

export async function PATCH(request: NextRequest) {
  const { issueId, sprintId } = await request.json();

  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" }, { status: 401 });
  }

  if (!issueId) {
    return Response.json({ message: "issueId is required." }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { projectId: true },
  });

  if (!issue) {
    return Response.json({ message: "Issue not found." }, { status: 404 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId: issue.projectId,
    minimum: Role.ENGINEER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  if (sprintId) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { projectId: true },
    });
    if (!sprint || sprint.projectId !== issue.projectId) {
      return Response.json({ message: "Invalid sprint for this project." }, { status: 400 });
    }
  }

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: { sprintId: sprintId ?? null },
  });

  return Response.json(updated);
}

