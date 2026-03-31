import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

export async function PATCH(request: NextRequest) {
  const { sprintId, name, status, startDate, endDate } = await request.json();

  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" }, { status: 401 });
  }

  if (!sprintId) {
    return Response.json({ message: "sprintId is required." }, { status: 400 });
  }

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    select: { projectId: true },
  });

  if (!sprint) {
    return Response.json({ message: "Sprint not found." }, { status: 404 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId: sprint.projectId,
    minimum: Role.MANAGER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  const updated = await prisma.sprint.update({
    where: { id: sprintId },
    data: {
      name: typeof name === "string" ? name : undefined,
      status: typeof status === "string" ? status : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });

  return Response.json(updated);
}

