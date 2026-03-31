import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  const {
    issueTitle,
    issueDescription,
    issueStatus,
    issuePriority,
    projectId,
    dueDate,
    labels,
    parentIssueId,
  } = await request.json();

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" });
  }

  if (!projectId) {
    return Response.json({ message: "projectId is required." }, { status: 400 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId,
    minimum: Role.ENGINEER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  if (session.user.id) {
    const response = await prisma.issue.create({
      data: {
        title: issueTitle,
        description: issueDescription,
        status: issueStatus,
        priority: issuePriority,
        projectId: projectId,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: Array.isArray(labels) ? labels : [],
        parentIssueId: parentIssueId ?? null,
      },
    });
    if (response) {
      return Response.json({
        message: "New issue created!",
      });
    }
  }
  return Response.json({ message: "Error occured!" });
}
