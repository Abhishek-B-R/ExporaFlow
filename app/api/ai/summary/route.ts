import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";
import { runAI } from "@/lib/ai/providers";
import { checkAIRateLimit } from "@/lib/ai/rate-limit-guard";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const rateLimited = await checkAIRateLimit(session.user.id);
  if (rateLimited) return rateLimited;

  const { projectId, period = "daily" } = await request.json();
  if (!projectId) return Response.json({ message: "projectId is required." }, { status: 400 });

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId,
    minimum: Role.VIEWER,
  });
  if (!access.ok) return Response.json({ message: access.message }, { status: access.status });

  const since = new Date();
  since.setDate(since.getDate() - (period === "weekly" ? 7 : 1));

  const [issues, activities] = await Promise.all([
    prisma.issue.findMany({
      where: { projectId, updatedAt: { gte: since } },
      select: { id: true, title: true, status: true, priority: true, updatedAt: true },
      take: 200,
    }),
    prisma.issueActivity.findMany({
      where: { issue: { projectId }, createdAt: { gte: since } },
      include: { issue: { select: { id: true, title: true } }, actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  try {
    const summary = await runAI([
      { role: "system", content: "Generate concise engineering lead summaries." },
      {
        role: "user",
        content: `Create a ${period} summary with highlights, risks, blockers and recommended actions:\n${JSON.stringify({
          issues,
          activities,
        })}`,
      },
    ]);
    return Response.json({ period, summary });
  } catch (error) {
    console.error("AI summary failed:", error);
    return Response.json({
      period,
      summary: `Fallback ${period} summary: ${issues.length} updated issues and ${activities.length} activities.`,
    });
  }
}
