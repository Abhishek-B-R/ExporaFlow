import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";
import {
  logIssueActivity,
  notifyUsers,
  resolveMentionedUserIds,
} from "@/lib/collaboration";
import { getAccessibleEmployeesForUser } from "@/lib/store-access";

export async function POST(request: NextRequest) {
  const { issueId, body } = await request.json();

  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" }, { status: 401 });
  }

  if (!issueId || typeof body !== "string" || !body.trim()) {
    return Response.json(
      { message: "issueId and a non-empty comment body are required." },
      { status: 400 },
    );
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, title: true, projectId: true, assignedUser: true },
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

  const projectUsers = await prisma.project.findUnique({
    where: { id: issue.projectId },
    select: {
      workspaceId: true,
      creator: { select: { id: true, name: true, email: true, username: true } },
      projectMembers: {
        select: {
          user: { select: { id: true, name: true, email: true, username: true } },
        },
      },
    },
  });

  const mentionCandidates = [
    ...(projectUsers?.creator ? [projectUsers.creator] : []),
    ...(projectUsers?.projectMembers.map((member) => member.user) ?? []),
  ];

  const storeEmployees = await getAccessibleEmployeesForUser(session.user.id);
  const emailsNeedingLookup = new Set<string>();
  for (const emp of storeEmployees) {
    if (emp.user) {
      mentionCandidates.push({
        ...emp.user,
        username: emp.user.email?.includes("@") ? emp.user.email.split("@")[0] : null,
      });
      continue;
    }
    if (emp.email) emailsNeedingLookup.add(emp.email.toLowerCase());
    mentionCandidates.push({
      id: emp.userId ?? emp.email,
      name: emp.fullName,
      email: emp.email,
      username: emp.email.includes("@") ? emp.email.split("@")[0] : null,
    });
  }

  if (emailsNeedingLookup.size > 0) {
    const usersByEmail = await prisma.user.findMany({
      where: { email: { in: [...emailsNeedingLookup], mode: "insensitive" } },
      select: { id: true, name: true, email: true, username: true },
    });
    for (const user of usersByEmail) mentionCandidates.push(user);
  }
  const mentionedUserIds = resolveMentionedUserIds(body, mentionCandidates);

  const comment = await prisma.issueComment.create({
    data: {
      issueId: issue.id,
      authorId: session.user.id,
      body: body.trim(),
      mentions: {
        create: mentionedUserIds.map((userId) => ({
          mentionedUserId: userId,
        })),
      },
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
      mentions: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  try {
    await logIssueActivity({
      issueId: issue.id,
      actorId: session.user.id,
      action: "COMMENT_ADDED",
      meta: { commentId: comment.id },
    });

    await notifyUsers({
      userIds: [...mentionedUserIds, issue.assignedUser ?? ""],
      actorId: session.user.id,
      type: "ISSUE_COMMENT",
      title: "New comment on issue",
      body: issue.title,
      issueId: issue.id,
      projectId: issue.projectId,
    });
  } catch (sideEffectError) {
    console.error("Non-fatal comment side-effect failure:", sideEffectError);
  }

  return Response.json(comment, { status: 201 });
}
