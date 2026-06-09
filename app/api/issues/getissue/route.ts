import { authOptions } from "@/lib/auth";
import { assertProjectRole } from "@/lib/authz";
import { prisma } from "@/db";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { issueId } = await request.json();

  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Kindly sign in!" }, { status: 401 });
  }
  if (!issueId) {
    return Response.json({ message: "issueId is required." }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      User: {
        select: { id: true, name: true, email: true, image: true },
      },
      parentIssue: {
        select: { id: true, title: true },
      },
      subtasks: {
        select: { id: true, title: true, status: true },
        orderBy: { createdAt: "asc" },
      },
      blockersFrom: true,
      blockedBy: true,
      comments: {
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
          mentions: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: {
          actor: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!issue) {
    return Response.json({ message: "Issue not found." }, { status: 404 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId: issue.projectId,
    minimum: Role.VIEWER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  return Response.json(issue);
}

