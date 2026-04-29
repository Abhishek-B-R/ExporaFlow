import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { logEvent } from "@/lib/observability/logger";
import crypto from "crypto";

function verifyGitHubSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if secret not configured
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function extractIssueKeys(text: string): string[] {
  // Match patterns like EXP-123, PROJ-456, etc.
  const refs = text.match(/[A-Z]+-\d+/g) ?? [];
  return Array.from(new Set(refs));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyGitHubSignature(rawBody, signature)) {
    return Response.json({ message: "Invalid signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const event = request.headers.get("x-github-event") ?? "unknown";
  const prTitle = (payload as { pull_request?: { title?: string } })?.pull_request?.title;
  const commitMessage = (payload as { head_commit?: { message?: string } })?.head_commit?.message;
  const prUrl = (payload as { pull_request?: { html_url?: string } })?.pull_request?.html_url;
  const commitUrl = (payload as { head_commit?: { url?: string } })?.head_commit?.url;

  const title = prTitle ?? commitMessage ?? "GitHub update";
  const linkUrl = prUrl ?? commitUrl ?? "";

  // Extract issue references from the full payload
  const allText = JSON.stringify(payload);
  const issueKeys = extractIssueKeys(allText);

  // Try to find and update matching issues by looking for the key in the title
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
      // Log activity for the linked issue
      await prisma.issueActivity.create({
        data: {
          issueId: issue.id,
          actorId: "system",
          action: event === "pull_request" ? "PR_LINKED" : "COMMIT_LINKED",
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

  logEvent("info", "GitHub webhook processed", {
    event,
    issueKeys,
    linkedCount: linkedIssues.length,
  });

  return Response.json({
    message: "GitHub webhook processed.",
    detectedIssueRefs: issueKeys,
    linkedIssues,
    linkedCount: linkedIssues.length,
    title,
  });
}
