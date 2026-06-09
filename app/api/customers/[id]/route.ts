import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { canAccessCustomerRecord } from "@/lib/store-access";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  organizationName: z.string().trim().min(1).optional(),
  address: z.string().nullable().optional(),
  email: z.string().trim().optional().nullable(),
  phoneNumber: z.string().nullable().optional(),
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
  if (!(await canAccessCustomerRecord(session.user.id, id))) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ message: "Invalid data." }, { status: 400 });
  }
  const data = { ...parsed.data };
  if (data.email === "") data.email = null;
  const row = await prisma.customer.update({
    where: { id },
    data,
  });
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
  if (!(await canAccessCustomerRecord(session.user.id, id))) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }
  await prisma.customer.delete({ where: { id } });
  return Response.json({ ok: true });
}
