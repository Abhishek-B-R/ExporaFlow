import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import {
  getAccessibleEmployeesForUser,
  userIsWorkspaceElevated,
} from "@/lib/store-access";
import {
  enrichEmployeesForAssignment,
  resolveEmployeeUserId,
} from "@/lib/employee-assignability";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().email(),
  phoneNumber: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  role: z.nativeEnum(Role).optional(),
  organizationAccess: z.array(z.string()).optional().nullable(),
  userId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const status = request.nextUrl.searchParams.get("status") as
    | "active"
    | "inactive"
    | "all"
    | null;
  const employees = await getAccessibleEmployeesForUser(session.user.id, {
    status: status ?? "active",
  });
  const enriched = await enrichEmployeesForAssignment(employees);
  return Response.json(enriched);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await userIsWorkspaceElevated(session.user.id))) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { message: "Invalid employee data." },
      { status: 400 },
    );
  }
  const {
    fullName,
    email,
    phoneNumber,
    designation,
    role,
    organizationAccess,
    userId,
  } = parsed.data;

  let resolvedOrgAccess = organizationAccess;
  if (!resolvedOrgAccess || resolvedOrgAccess.length === 0) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    });
    if (membership) {
      resolvedOrgAccess = [membership.workspaceId];
    }
  }

  let resolvedUserId =
    userId && userId.length > 0 ? userId : null;
  if (!resolvedUserId) {
    const matchedUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    resolvedUserId = matchedUser?.id ?? null;
  }

  const row = await prisma.employee.create({
    data: {
      fullName,
      email,
      phoneNumber: phoneNumber ?? null,
      designation: designation ?? null,
      role: role ?? Role.ENGINEER,
      organizationAccess:
        resolvedOrgAccess && resolvedOrgAccess.length > 0
          ? (resolvedOrgAccess as Prisma.InputJsonValue)
          : undefined,
      userId: resolvedUserId,
    },
  });
  return Response.json(row);
}
