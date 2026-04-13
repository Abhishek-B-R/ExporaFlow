import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

function mapCsvStatusToCanonical(input?: string) {
  const value = (input ?? "").trim().toLowerCase();
  if (!value) return "Backlog";
  if (["to do", "todo", "open", "new", "backlog"].includes(value)) return "Backlog";
  if (["selected for development", "planned", "ready"].includes(value)) return "Planned";
  if (["in progress", "doing", "working", "development"].includes(value)) return "Working";
  if (["done", "completed", "closed", "resolved"].includes(value)) return "Completed";
  if (["cancelled", "canceled", "wont do", "won't do", "rejected"].includes(value)) return "Cancelled";
  return "Backlog";
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }
    currentCell += char;
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell.length > 0)) rows.push(currentRow);
  if (!rows.length) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, (cells[index] ?? "").trim()])),
  );
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { projectId, csv } = await request.json();
  if (!projectId || !csv || typeof csv !== "string") {
    return Response.json({ message: "projectId and csv content are required." }, { status: 400 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId,
    minimum: Role.ENGINEER,
  });
  if (!access.ok) return Response.json({ message: access.message }, { status: access.status });

  const records = parseCsv(csv);
  const created = [];
  for (const record of records) {
    if (!record.title) continue;
    const issue = await prisma.issue.create({
      data: {
        title: record.title,
        description: record.description || null,
        status: mapCsvStatusToCanonical(record.status),
        priority: record.priority || "No Priority",
        projectId,
      },
      select: { id: true, title: true },
    });
    created.push(issue);
  }

  return Response.json({ imported: created.length, issues: created });
}
