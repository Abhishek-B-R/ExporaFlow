import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

function mapGitHubLabelsToStatus(labels: string[]): string {
  const lowerLabels = labels.map((l) => l.toLowerCase());
  if (lowerLabels.some((l) => ["bug", "critical", "urgent"].includes(l))) return "Working";
  if (lowerLabels.some((l) => ["in progress", "doing", "wip"].includes(l))) return "Working";
  if (lowerLabels.some((l) => ["done", "completed", "fixed"].includes(l))) return "Completed";
  if (lowerLabels.some((l) => ["wontfix", "invalid", "duplicate"].includes(l))) return "Cancelled";
  if (lowerLabels.some((l) => ["planned", "ready", "next"].includes(l))) return "Planned";
  return "Backlog";
}

function mapGitHubLabelsToPriority(labels: string[]): string {
  const lowerLabels = labels.map((l) => l.toLowerCase());
  if (lowerLabels.some((l) => l.includes("critical") || l.includes("urgent") || l.includes("p0")))
    return "Urgent";
  if (lowerLabels.some((l) => l.includes("high") || l.includes("p1") || l.includes("important")))
    return "High";
  if (lowerLabels.some((l) => l.includes("medium") || l.includes("p2"))) return "Medium";
  if (lowerLabels.some((l) => l.includes("low") || l.includes("p3") || l.includes("minor")))
    return "Low";
  return "No Priority";
}

type GitHubIssue = {
  title: string;
  body?: string | null;
  labels?: Array<{ name: string } | string>;
  state?: string;
  pull_request?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { projectId, repo } = await request.json();

  if (!projectId || !repo || typeof repo !== "string") {
    return Response.json(
      { message: "projectId and repo (owner/repo) are required." },
      { status: 400 },
    );
  }

  // Validate repo format
  const repoMatch = repo.match(/^([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)$/);
  if (!repoMatch) {
    return Response.json(
      { message: "Invalid repo format. Use owner/repo (e.g. facebook/react)." },
      { status: 400 },
    );
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId,
    minimum: Role.ENGINEER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  // Auto-fetch GitHub access token from the user's linked GitHub account
  const githubAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
    select: { access_token: true },
  });

  // Build request headers
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "ExporaFlow-Import",
  };
  if (githubAccount?.access_token) {
    headers.Authorization = `Bearer ${githubAccount.access_token}`;
  }

  let allIssues: GitHubIssue[] = [];
  let page = 1;
  const perPage = 100;

  try {
    // Fetch up to 3 pages (300 issues max)
    while (page <= 3) {
      const url = `https://api.github.com/repos/${repo}/issues?state=open&per_page=${perPage}&page=${page}&sort=created&direction=desc`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          return Response.json(
            { message: `Repository "${repo}" not found. If it's private, make sure you signed in with GitHub.` },
            { status: 404 },
          );
        }
        if (response.status === 403) {
          return Response.json(
            { message: "GitHub API rate limit exceeded. Make sure you're signed in with GitHub." },
            { status: 429 },
          );
        }
        return Response.json(
          { message: `GitHub API error: ${response.status} ${response.statusText}` },
          { status: 502 },
        );
      }

      const issues: GitHubIssue[] = await response.json();
      if (!Array.isArray(issues) || issues.length === 0) break;

      // Filter out pull requests (GitHub API returns PRs in /issues endpoint)
      const realIssues = issues.filter((i) => !i.pull_request);
      allIssues = allIssues.concat(realIssues);

      if (issues.length < perPage) break;
      page += 1;
    }
  } catch (error) {
    return Response.json(
      { message: `Failed to fetch from GitHub: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 502 },
    );
  }

  if (allIssues.length === 0) {
    return Response.json({ imported: 0, message: "No open issues found in this repository." });
  }

  // Import issues into the project
  let imported = 0;
  for (const ghIssue of allIssues) {
    const title = ghIssue.title?.trim();
    if (!title) continue;

    const labels = (ghIssue.labels ?? []).map((l) =>
      typeof l === "string" ? l : l.name,
    );

    await prisma.issue.create({
      data: {
        projectId,
        title,
        description: ghIssue.body?.slice(0, 5000) ?? null,
        status: mapGitHubLabelsToStatus(labels),
        priority: mapGitHubLabelsToPriority(labels),
      },
    });
    imported += 1;
  }

  return Response.json({
    imported,
    total: allIssues.length,
    message: `Imported ${imported} issues from ${repo}.`,
  });
}
