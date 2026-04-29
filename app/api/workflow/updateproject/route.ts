import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function PATCH(request: NextRequest) {
  const {
    projectId,
    projTitle,
    projDescription,
    projContent,
    priority,
    status,
  } = await request.json();

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return new Response(JSON.stringify({ message: "Kindly log in!" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const access = await assertProjectRole({
      userId: session.user.id,
      projectId,
      minimum: Role.MANAGER,
    });
    if (!access.ok) {
      return new Response(JSON.stringify({ message: access.message }), {
        status: access.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (typeof projTitle === "string" && projTitle.trim()) {
      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
        select: { workspaceId: true, createdBy: true },
      });
      const normalizedTitle = normalizeName(projTitle);
      const possibleDuplicates = await prisma.project.findMany({
        where: {
          id: { not: projectId },
          OR: [
            { title: { equals: projTitle.trim(), mode: "insensitive" } },
            { createdBy: existingProject?.createdBy },
            ...(existingProject?.workspaceId
              ? [{ workspaceId: existingProject.workspaceId }]
              : []),
          ],
        },
        select: { id: true, title: true },
        take: 100,
      });
      const duplicate = possibleDuplicates.find(
        (project) => normalizeName(project.title) === normalizedTitle,
      );
      if (duplicate) {
        return new Response(
          JSON.stringify({
            message: "A project with this name already exists.",
            duplicate,
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: projTitle,
        description: projDescription,
        content: projContent,
        priority: priority,
        status: status,
      },
    });

    if (updatedProject) {
      return new Response(JSON.stringify({ message: "Project updated!" }));
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Error updating project!" }));
  }
}
