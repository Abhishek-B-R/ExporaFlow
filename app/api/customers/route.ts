import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getAccessibleCustomersForUser, userIsWorkspaceElevated } from "@/lib/store-access";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(1),
  organizationName: z.string().trim().min(1),
  address: z.string().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const customers = await getAccessibleCustomersForUser(session.user.id);
  return Response.json(customers);
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
    return Response.json({ message: "Invalid customer data." }, { status: 400 });
  }
  const { name, organizationName, address, email, phoneNumber } = parsed.data;
  const row = await prisma.customer.create({
    data: {
      name,
      organizationName,
      address: address ?? null,
      email: email && email.length > 0 ? email : null,
      phoneNumber: phoneNumber ?? null,
    },
  });
  return Response.json(row);
}
