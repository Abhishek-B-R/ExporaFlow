import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  const { projTitle, projDescription, projContent, priority, status } =
    await request.json();

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" });
  }

  if (session?.user.id) {
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });

    const response = await prisma.project.create({
      data: {
        title: projTitle,
        description: projDescription,
        createdBy: session.user.id,
        content: projContent,
        priority: priority,
        status: status,
        workspaceId: workspaceMember?.workspaceId ?? null,
        projectMembers: {
          create: {
            userId: session.user.id,
            role: Role.ADMIN,
          },
        },
      },
    });
    if (response) {
      return Response.json({
        message: "New project created!",
      });
    }
  }
  return Response.json({ message: "Error occured!" });
}
