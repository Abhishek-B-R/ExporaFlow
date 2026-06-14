import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role, TicketType } from "@prisma/client";

export async function POST(request: NextRequest) {
  const { project_id, ticketType } = await request.json();

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return new Response(JSON.stringify({ message: "Kindly Sign in!" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  if (!project_id) {
    return new Response(JSON.stringify({ message: "project_id is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId: project_id,
    minimum: Role.VIEWER,
  });
  if (!access.ok) {
    return new Response(JSON.stringify({ message: access.message }), {
      status: access.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ticketFilter =
    ticketType && Object.values(TicketType).includes(ticketType as TicketType)
      ? { ticketType: ticketType as TicketType }
      : {};

  const issues = await prisma.issue.findMany({
    where: {
      projectId: project_id,
      ...ticketFilter,
    },
    include: {
      User: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return new Response(JSON.stringify(issues), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
