import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

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
