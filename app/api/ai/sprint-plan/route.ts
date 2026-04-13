import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";
import { runAI } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { projectId, sprintId } = await request.json();
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

  const issues = await prisma.issue.findMany({
    where: { projectId, ...(sprintId ? { sprintId } : {}) },
    select: { id: true, title: true, description: true, priority: true, status: true },
    take: 100,
  });

  try {
    const completion = await runAI([
      { role: "system", content: "Provide sprint planning suggestions in JSON only." },
      {
        role: "user",
        content:
          `Return JSON with effortEstimateByIssue (map id->storyPoints) and riskFlags (array).\nIssues:\n` +
          JSON.stringify(issues),
      },
    ]);
    return Response.json({ planning: JSON.parse(completion), sourceIssues: issues.length });
  } catch (error) {
    console.error("AI sprint planning failed:", error);
    return Response.json({
      planning: {
        effortEstimateByIssue: Object.fromEntries(issues.map((issue) => [issue.id, 3])),
        riskFlags: ["Fallback estimation used because AI provider is unavailable."],
      },
      sourceIssues: issues.length,
    });
  }
}
