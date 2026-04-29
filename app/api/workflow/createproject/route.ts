import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, Role } from "@prisma/client";

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  const { projTitle, projDescription, projContent, priority, status } =
    await request.json();

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" }, { status: 401 });
  }

  if (!projTitle || typeof projTitle !== "string" || !projTitle.trim()) {
    return Response.json({ message: "Project title is required." }, { status: 400 });
  }

  if (session?.user.id) {
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });

    const normalizedTitle = normalizeName(projTitle);
    const possibleDuplicates = await prisma.project.findMany({
      where: {
        OR: [
          { title: { equals: projTitle.trim(), mode: "insensitive" } },
          { createdBy: session.user.id },
          ...(workspaceMember?.workspaceId
            ? [{ workspaceId: workspaceMember.workspaceId }]
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
      return Response.json(
        {
          message: "A project with this name already exists.",
          duplicate,
        },
        { status: 409 },
      );
    }

    try {
      const response = await prisma.project.create({
        data: {
          title: projTitle.trim(),
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return Response.json(
          { message: "A project with this name already exists." },
          { status: 409 },
        );
      }
      throw error;
    }
  }
  return Response.json({ message: "Error occured!" });
}
