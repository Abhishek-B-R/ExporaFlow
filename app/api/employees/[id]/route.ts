import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { canAccessEmployeeRecord } from "@/lib/store-access";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  organizationAccess: z.array(z.string()).nullable().optional(),
  userId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await canAccessEmployeeRecord(session.user.id, id))) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ message: "Invalid data." }, { status: 400 });
  }
  const d = parsed.data;
  const data: Prisma.EmployeeUpdateInput = {};
  if (d.fullName !== undefined) data.fullName = d.fullName;
  if (d.email !== undefined) data.email = d.email;
  if (d.phoneNumber !== undefined) data.phoneNumber = d.phoneNumber;
  if (d.designation !== undefined) data.designation = d.designation;
  if (d.role !== undefined) data.role = d.role;
  if (d.organizationAccess !== undefined) {
    data.organizationAccess =
      d.organizationAccess === null
        ? Prisma.JsonNull
        : (d.organizationAccess as Prisma.InputJsonValue);
  }
  if (d.userId !== undefined) {
    data.user = d.userId ? { connect: { id: d.userId } } : { disconnect: true };
  }
  if (d.isActive !== undefined) data.isActive = d.isActive;

  const existing = await prisma.employee.findUnique({
    where: { id },
    select: { userId: true, organizationAccess: true },
  });

  const row = await prisma.employee.update({
    where: { id },
    data,
  });

  if (d.role !== undefined && existing?.userId) {
    const workspaceIds = Array.isArray(existing.organizationAccess)
      ? (existing.organizationAccess as string[])
      : [];
    if (workspaceIds.length > 0) {
      await prisma.workspaceMember.updateMany({
        where: {
          userId: existing.userId,
          workspaceId: { in: workspaceIds },
        },
        data: { role: d.role },
      });
    }
  }

  return Response.json(row);
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!(await canAccessEmployeeRecord(session.user.id, id))) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }
  await prisma.employee.delete({ where: { id } });
  return Response.json({ ok: true });
}
