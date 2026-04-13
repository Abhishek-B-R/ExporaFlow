import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const views = await prisma.savedView.findMany({
    where: { ownerId: session.user.id },
    include: {
      project: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json(views);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { name, description, projectId, filters } = await request.json();
  if (!name || typeof name !== "string" || !filters || typeof filters !== "object") {
    return Response.json(
      { message: "name and filters object are required." },
      { status: 400 },
    );
  }

  if (projectId) {
    const access = await assertProjectRole({
      userId: session.user.id,
      projectId,
      minimum: Role.VIEWER,
    });
    if (!access.ok) {
      return Response.json({ message: access.message }, { status: access.status });
    }
  }

  const view = await prisma.savedView.create({
    data: {
      ownerId: session.user.id,
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : null,
      projectId: typeof projectId === "string" ? projectId : null,
      filters: filters as object,
    },
    include: {
      project: { select: { id: true, title: true } },
    },
  });

  return Response.json(view, { status: 201 });
}
