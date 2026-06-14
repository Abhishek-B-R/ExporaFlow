import { authOptions } from "@/lib/auth";
import { assertProjectPermission } from "@/lib/authz";
import {
  EXPORT_HEADERS,
  fetchIssuesForExport,
  logExportAudit,
  mapIssueToExportRow,
  rowsToCsv,
  type ExportTicketRow,
} from "@/lib/export-tickets";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { Prisma, TicketType } from "@prisma/client";

function xmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowsToExcelXml(rows: ExportTicketRow[]): string {
  const headerCells = EXPORT_HEADERS.map(
    (h) => `<Cell><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`,
  ).join("");
  const body = rows
    .map((row) => {
      const cells = EXPORT_HEADERS.map(
        (key) =>
          `<Cell><Data ss:Type="String">${xmlEscape(row[key])}</Data></Cell>`,
      ).join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Tickets">
<Table>
<Row>${headerCells}</Row>
${body}
</Table>
</Worksheet>
</Workbook>`;
}

function parseIssueIds(raw: string | null): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const projectId = sp.get("projectId");
  const ticketType = sp.get("ticketType");
  const format = (sp.get("format") ?? "csv").toLowerCase();
  const issueIds = parseIssueIds(sp.get("issueIds"));
  const search = sp.get("search")?.trim();

  if (!projectId && !issueIds) {
    return Response.json(
      { message: "projectId or issueIds is required." },
      { status: 400 },
    );
  }

  if (projectId) {
    const access = await assertProjectPermission({
      userId: session.user.id,
      projectId,
      permission: "exportTickets",
    });
    if (!access.ok) {
      return Response.json(
        { message: access.message },
        { status: access.status },
      );
    }
  }

  const where: Prisma.IssueWhereInput = {
    ...(projectId ? { projectId } : {}),
    ...(issueIds ? { id: { in: issueIds } } : {}),
    ...(ticketType && Object.values(TicketType).includes(ticketType as TicketType)
      ? { ticketType: ticketType as TicketType }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { requesterName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const issues = await fetchIssuesForExport({ where });
  const rows = issues.map(mapIssueToExportRow);

  await logExportAudit({
    userId: session.user.id,
    projectId,
    format,
    filters: {
      ticketType,
      issueIds,
      search,
    },
    rowCount: rows.length,
  });

  const slug =
    issues[0]?.Project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ??
    "tickets";

  if (format === "xlsx") {
    const body = rowsToExcelXml(rows);
    return new Response(body, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}-tickets.xls"`,
      },
    });
  }

  const body = rowsToCsv(rows);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-tickets.csv"`,
    },
  });
}
