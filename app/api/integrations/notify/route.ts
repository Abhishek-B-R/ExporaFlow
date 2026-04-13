import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { sendIntegrationNotification } from "@/lib/integrations/notify";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { channel, title, body, issueId, projectId } = await request.json();
  if (!channel || !title) {
    return Response.json({ message: "channel and title are required." }, { status: 400 });
  }

  let resolvedProjectId: string | null = typeof projectId === "string" ? projectId : null;
  if (issueId) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { projectId: true },
    });
    if (!issue) {
      return Response.json({ message: "Issue not found." }, { status: 404 });
    }
    if (resolvedProjectId && resolvedProjectId !== issue.projectId) {
      return Response.json(
        { message: "projectId does not match the issue's project." },
        { status: 400 },
      );
    }
    resolvedProjectId = issue.projectId;
  }

  if (!resolvedProjectId) {
    return Response.json(
      { message: "projectId or issueId is required for authorization." },
      { status: 400 },
    );
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId: resolvedProjectId,
    minimum: Role.ENGINEER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  try {
    const result = await sendIntegrationNotification({
      channel,
      title,
      body,
      issueId,
      projectId: resolvedProjectId,
    });
    return Response.json({ message: "Notification dispatch attempted.", result });
  } catch (error) {
    console.error("Integration notify failed:", error);
    return Response.json({ message: "Failed to dispatch notification." }, { status: 500 });
  }
}
