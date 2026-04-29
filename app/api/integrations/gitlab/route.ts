import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { logEvent } from "@/lib/observability/logger";

function verifyGitLabToken(request: NextRequest): boolean {
  const secret = process.env.GITLAB_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if not configured
  const token = request.headers.get("x-gitlab-token");
  return token === secret;
}

function extractIssueKeys(text: string): string[] {
  const refs = text.match(/[A-Z]+-\d+/g) ?? [];
  return Array.from(new Set(refs));
}

export async function POST(request: NextRequest) {
  if (!verifyGitLabToken(request)) {
    return Response.json({ message: "Invalid token." }, { status: 401 });
  }

  const payload = await request.json();
  const event = request.headers.get("x-gitlab-event") ?? "unknown";

  const mrTitle = payload?.object_attributes?.title;
  const commitMessage = payload?.commits?.[0]?.message;
  const mrUrl = payload?.object_attributes?.url;
  const commitUrl = payload?.commits?.[0]?.url;

  const title = mrTitle ?? commitMessage ?? "GitLab update";
  const linkUrl = mrUrl ?? commitUrl ?? "";

  const allText = JSON.stringify(payload);
  const issueKeys = extractIssueKeys(allText);

  const linkedIssues: Array<{ id: string; title: string }> = [];

  for (const key of issueKeys) {
    const matchingIssues = await prisma.issue.findMany({
      where: {
        title: { contains: key, mode: "insensitive" },
      },
      select: { id: true, title: true, projectId: true },
      take: 5,
    });

    for (const issue of matchingIssues) {
      await prisma.issueActivity.create({
        data: {
          issueId: issue.id,
          actorId: "system",
          action: event.includes("Merge Request") ? "MR_LINKED" : "COMMIT_LINKED",
          field: "integration",
          fromValue: null,
          toValue: linkUrl || title,
          meta: {
            event,
            ref: key,
            title: title.slice(0, 200),
            url: linkUrl,
          },
        },
      });
      linkedIssues.push({ id: issue.id, title: issue.title });
    }
  }

  logEvent("info", "GitLab webhook processed", {
    event,
    issueKeys,
    linkedCount: linkedIssues.length,
  });

  return Response.json({
    message: "GitLab webhook processed.",
    detectedIssueRefs: issueKeys,
    linkedIssues,
    linkedCount: linkedIssues.length,
    title,
  });
}
