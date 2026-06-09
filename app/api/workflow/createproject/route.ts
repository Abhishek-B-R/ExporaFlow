import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, Role } from "@prisma/client";
import { isProjectServiceLineValue } from "@/utils/project-service-line";
import { parseStoredDate } from "@/lib/ticket-sla";
import { assertWorkspaceMember } from "@/lib/rbac-permissions";

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  const {
    projTitle,
    projDescription,
    projContent,
    priority,
    status,
    serviceLine,
    customerId,
    startDate,
    targetDate,
  } = await request.json();

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" }, { status: 401 });
  }

  if (!projTitle || typeof projTitle !== "string" || !projTitle.trim()) {
    return Response.json({ message: "Project title is required." }, { status: 400 });
  }

  if (!isProjectServiceLineValue(serviceLine)) {
    return Response.json(
      { message: "Select a service line for this project." },
      { status: 400 },
    );
  }

  const workspaceAccess = await assertWorkspaceMember(session.user.id);
  if (!workspaceAccess.ok) {
    return Response.json({ message: workspaceAccess.message }, { status: workspaceAccess.status });
  }

  if (!customerId || typeof customerId !== "string") {
    return Response.json(
      { message: "A customer is required for every project." },
      { status: 400 },
    );
  }

  const parsedStart = parseStoredDate(
    typeof startDate === "string" ? startDate : undefined,
  );
  const parsedTarget = parseStoredDate(
    typeof targetDate === "string" ? targetDate : undefined,
  );
  if (parsedStart && parsedTarget && parsedTarget < parsedStart) {
    return Response.json(
      { message: "End date must be on or after the start date." },
      { status: 400 },
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, isActive: true },
  });
  if (!customer) {
    return Response.json({ message: "Customer not found." }, { status: 400 });
  }
  if (!customer.isActive) {
    return Response.json(
      { message: "Selected customer is inactive. Choose an active customer." },
      { status: 400 },
    );
  }
  const resolvedCustomerId = customer.id;

  if (session?.user.id) {
    const workspaceMember = workspaceAccess.membership;

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
          serviceLine,
          customerId: resolvedCustomerId,
          startDate: parsedStart,
          targetDate: parsedTarget,
          workspaceId: workspaceMember.workspaceId,
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
