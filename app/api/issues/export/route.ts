import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { formatTicketKey } from "@/lib/ticket-display";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { Role, TicketType } from "@prisma/client";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  const ticketType = request.nextUrl.searchParams.get("ticketType");

  if (!projectId) {
    return Response.json({ message: "projectId is required." }, { status: 400 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId,
    minimum: Role.VIEWER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { title: true },
  });

  const issues = await prisma.issue.findMany({
    where: {
      projectId,
      ...(ticketType === TicketType.INCIDENT || ticketType === TicketType.CHANGE
        ? { ticketType }
        : {}),
    },
    orderBy: [{ ticketNumber: "asc" }, { createdAt: "asc" }],
    include: {
      User: { select: { name: true, email: true } },
    },
  });

  const header = [
    "Ticket",
    "Title",
    "Type",
    "Status",
    "Priority",
    "Urgency",
    "Requester",
    "Assignee",
    "Due date",
    "Created",
  ];

  const lines = [
    header.join(","),
    ...issues.map((issue) =>
      [
        formatTicketKey({
          ticketType: issue.ticketType,
          ticketNumber: issue.ticketNumber,
        }) ?? issue.id,
        issue.title,
        issue.ticketType,
        issue.status ?? "",
        issue.priority ?? "",
        issue.urgency,
        issue.requesterName ?? "",
        issue.User?.name || issue.User?.email || "",
        issue.dueDate ? issue.dueDate.toISOString().slice(0, 10) : "",
        issue.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  const slug = (project?.title ?? "project").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const body = lines.join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-tickets.csv"`,
    },
  });
}
