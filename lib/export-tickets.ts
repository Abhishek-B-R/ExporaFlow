import { prisma } from "@/db";
import { formatTicketKey } from "@/lib/ticket-display";
import { ticketTypeLabel } from "@/lib/ticket-type-labels";
import { Prisma } from "@prisma/client";

export type ExportTicketRow = {
  ticketNumber: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  urgency: string;
  requester: string;
  requesterEmail: string;
  assignee: string;
  project: string;
  customer: string;
  createdDate: string;
  dueDate: string;
  lastUpdated: string;
};

export const EXPORT_HEADERS: (keyof ExportTicketRow)[] = [
  "ticketNumber",
  "title",
  "description",
  "type",
  "status",
  "priority",
  "urgency",
  "requester",
  "requesterEmail",
  "assignee",
  "project",
  "customer",
  "createdDate",
  "dueDate",
  "lastUpdated",
];

export function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function rowsToCsv(rows: ExportTicketRow[]): string {
  const headerLine = EXPORT_HEADERS.join(",");
  const lines = rows.map((row) =>
    EXPORT_HEADERS.map((key) => csvCell(row[key])).join(","),
  );
  return [headerLine, ...lines].join("\n");
}

type IssueWithRelations = Prisma.IssueGetPayload<{
  include: {
    User: { select: { name: true; email: true } };
    Project: {
      select: {
        title: true;
        customer: { select: { organizationName: true; name: true } };
      };
    };
  };
}>;

export function mapIssueToExportRow(issue: IssueWithRelations): ExportTicketRow {
  const ticketKey =
    formatTicketKey({
      globalTicketNumber: issue.globalTicketNumber,
      ticketType: issue.ticketType,
      ticketNumber: issue.ticketNumber,
    }) ?? issue.id;

  const customer =
    issue.Project.customer?.organizationName ||
    issue.Project.customer?.name ||
    "";

  return {
    ticketNumber: ticketKey,
    title: issue.title,
    description: issue.description ?? "",
    type: ticketTypeLabel(issue.ticketType),
    status: issue.status ?? "",
    priority: issue.priority ?? "",
    urgency: issue.urgency,
    requester: issue.requesterName ?? "",
    requesterEmail: issue.requesterEmail ?? "",
    assignee: issue.User?.name || issue.User?.email || "",
    project: issue.Project.title,
    customer,
    createdDate: issue.createdAt.toISOString(),
    dueDate: issue.dueDate ? issue.dueDate.toISOString() : "",
    lastUpdated: issue.updatedAt.toISOString(),
  };
}

export async function fetchIssuesForExport(params: {
  where: Prisma.IssueWhereInput;
  orderBy?: Prisma.IssueOrderByWithRelationInput[];
}) {
  return prisma.issue.findMany({
    where: params.where,
    orderBy: params.orderBy ?? [
      { globalTicketNumber: "asc" },
      { ticketNumber: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      User: { select: { name: true, email: true } },
      Project: {
        select: {
          title: true,
          customer: { select: { organizationName: true, name: true } },
        },
      },
    },
  });
}

export async function logExportAudit(params: {
  userId: string;
  projectId?: string | null;
  format: string;
  filters?: unknown;
  rowCount: number;
}) {
  return prisma.exportAuditLog.create({
    data: {
      userId: params.userId,
      projectId: params.projectId ?? null,
      format: params.format,
      filters:
        typeof params.filters === "undefined"
          ? undefined
          : (params.filters as Prisma.InputJsonValue),
      rowCount: params.rowCount,
    },
  });
}
