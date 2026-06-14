import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { assertProjectPermission } from "@/lib/authz";
import { Role } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  projectId: z.string().min(1),
  memberUserIds: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return Response.json({ message: "projectId is required." }, { status: 400 });
  }

  const access = await assertProjectPermission({
    userId: session.user.id,
    projectId,
    permission: "viewTickets",
  });
  if (!access.ok) {
    return Response.json(
      { message: access.message },
      { status: access.status },
    );
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: {
      userId: true,
      role: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(
    members.map((m) => ({
      userId: m.userId,
      role: m.role,
      user: m.user,
    })),
  );
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ message: "Invalid payload." }, { status: 400 });
  }

  const { projectId, memberUserIds } = parsed.data;

  const access = await assertProjectPermission({
    userId: session.user.id,
    projectId,
    permission: "inviteMembers",
  });
  if (!access.ok) {
    return Response.json(
      { message: access.message },
      { status: access.status },
    );
  }

  const uniqueIds = Array.from(new Set(memberUserIds)).filter(Boolean);

  const employees = await prisma.employee.findMany({
    where: { userId: { in: uniqueIds } },
    select: { userId: true, isActive: true },
  });
  const inactive = employees.filter((e) => !e.isActive && e.userId);
  if (inactive.length > 0) {
    return Response.json(
      { message: "Inactive employees cannot be assigned to projects." },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdBy: true },
  });
  if (!project) {
    return Response.json({ message: "Project not found." }, { status: 404 });
  }

  const keepIds = new Set([project.createdBy, ...uniqueIds]);

  await prisma.$transaction(async (tx) => {
    await tx.projectMember.deleteMany({
      where: {
        projectId,
        userId: { notIn: [...keepIds] },
        role: { not: Role.ADMIN },
      },
    });

    for (const userId of uniqueIds) {
      if (userId === project.createdBy) continue;
      await tx.projectMember.upsert({
        where: { projectId_userId: { projectId, userId } },
        create: { projectId, userId, role: Role.ENGINEER },
        update: {},
      });
    }
  });

  return Response.json({ message: "Project members updated." });
}
