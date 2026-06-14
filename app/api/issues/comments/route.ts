import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { assertProjectPermission } from "@/lib/authz";
import {
  logIssueActivity,
  notifyUsers,
  resolveMentionedUserIds,
} from "@/lib/collaboration";
import { loadMentionCandidatesForProject } from "@/lib/mention-candidates";
import { queueMentionEmails } from "@/lib/mention-email";

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
    select: {
      id: true,
      title: true,
      projectId: true,
      ticketType: true,
      ticketNumber: true,
      globalTicketNumber: true,
    },
  });
  if (!issue) {
    return Response.json({ message: "Issue not found." }, { status: 404 });
  }

  const access = await assertProjectPermission({
    userId: session.user.id,
    projectId: issue.projectId,
    permission: "comment",
  });
  if (!access.ok) {
    return Response.json(
      { message: access.message },
      { status: access.status },
    );
  }

  const mentionCandidates = await loadMentionCandidatesForProject(
    issue.projectId,
    session.user.id,
  );
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

    if (mentionedUserIds.length > 0) {
      await notifyUsers({
        userIds: mentionedUserIds,
        actorId: session.user.id,
        type: "ISSUE_MENTION",
        title: "You were mentioned in a comment",
        body: issue.title,
        issueId: issue.id,
        projectId: issue.projectId,
      });

      queueMentionEmails({
        mentionedUserIds,
        actorId: session.user.id,
        issueId: issue.id,
        projectId: issue.projectId,
        issueTitle: issue.title,
        excerpt: body.trim(),
        ticketType: issue.ticketType,
        ticketNumber: issue.ticketNumber,
        globalTicketNumber: issue.globalTicketNumber,
        sourceType: "comment",
        sourceId: comment.id,
      });
    }
  } catch (sideEffectError) {
    console.error("Non-fatal comment side-effect failure:", sideEffectError);
  }

  return Response.json(comment, { status: 201 });
}
