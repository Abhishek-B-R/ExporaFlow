import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getAccessibleEmployeesForUser, userIsWorkspaceElevated } from "@/lib/store-access";
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const employees = await getAccessibleEmployeesForUser(session.user.id);
  return Response.json(employees);
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
    return Response.json({ message: "Invalid employee data." }, { status: 400 });
  }
  const { fullName, email, phoneNumber, designation, role, organizationAccess, userId } =
    parsed.data;
  const row = await prisma.employee.create({
    data: {
      fullName,
      email,
      phoneNumber: phoneNumber ?? null,
      designation: designation ?? null,
      role: role ?? Role.ENGINEER,
      organizationAccess:
        organizationAccess && organizationAccess.length > 0
          ? (organizationAccess as Prisma.InputJsonValue)
          : undefined,
      user: userId && userId.length > 0 ? { connect: { id: userId } } : undefined,
    },
  });
  return Response.json(row);
}
