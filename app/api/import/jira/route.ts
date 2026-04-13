import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

type JiraLikeIssue = {
  fields?: {
    summary?: string;
    description?: unknown;
    priority?: { name?: string };
    status?: { name?: string };
  };
};

function mapJiraStatusToCanonical(input?: string) {
  const value = (input ?? "").trim().toLowerCase();
  if (!value) return "Backlog";
  if (["to do", "todo", "open", "new", "backlog"].includes(value)) return "Backlog";
  if (["selected for development", "planned", "ready"].includes(value)) return "Planned";
  if (["in progress", "doing", "working", "development"].includes(value)) return "Working";
  if (["done", "completed", "closed", "resolved"].includes(value)) return "Completed";
  if (["cancelled", "canceled", "wont do", "won't do", "rejected"].includes(value)) return "Cancelled";
  return "Backlog";
}

function normalizeJiraDescription(value: unknown) {
  if (value === null || typeof value === "undefined") return null;
  if (typeof value === "string") return value;
  const serialized = JSON.stringify(value);
  return serialized === "null" ? null : serialized;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { projectId, issues } = await request.json();
  if (!projectId || !Array.isArray(issues)) {
    return Response.json({ message: "projectId and issues[] are required." }, { status: 400 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId,
    minimum: Role.ENGINEER,
  });
  if (!access.ok) return Response.json({ message: access.message }, { status: access.status });

  let imported = 0;
  for (const rawIssue of issues as JiraLikeIssue[]) {
    const title = rawIssue.fields?.summary?.trim();
    if (!title) continue;
    await prisma.issue.create({
      data: {
        projectId,
        title,
        description: normalizeJiraDescription(rawIssue.fields?.description),
        status: mapJiraStatusToCanonical(rawIssue.fields?.status?.name),
        priority: rawIssue.fields?.priority?.name ?? "No Priority",
      },
    });
    imported += 1;
  }

  return Response.json({ imported });
}
