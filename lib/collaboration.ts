import { prisma } from "@/db";
import { Prisma } from "@prisma/client";

type ActivityPayload = {
  issueId: string;
  actorId: string;
  action: string;
  field?: string;
  fromValue?: string | null;
  toValue?: string | null;
  meta?: unknown;
};

export async function logIssueActivity(payload: ActivityPayload) {
  return prisma.issueActivity.create({
    data: {
      issueId: payload.issueId,
      actorId: payload.actorId,
      action: payload.action,
      field: payload.field,
      fromValue: payload.fromValue ?? null,
      toValue: payload.toValue ?? null,
      meta:
        typeof payload.meta === "undefined"
          ? undefined
          : (payload.meta as Prisma.InputJsonValue),
    },
  });
}

type NotificationPayload = {
  userIds: string[];
  actorId?: string;
  type: string;
  title: string;
  body?: string;
  issueId?: string;
  projectId?: string;
};

export async function notifyUsers(payload: NotificationPayload) {
  const uniqueRecipients = Array.from(new Set(payload.userIds)).filter(
    (userId) => !!userId && userId !== payload.actorId,
  );
  if (uniqueRecipients.length === 0) return;

  await prisma.notification.createMany({
    data: uniqueRecipients.map((userId) => ({
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      issueId: payload.issueId,
      projectId: payload.projectId,
    })),
  });
}

export function extractMentionHandles(text: string) {
  if (!text) return [];
  const mentions = text.match(/@([a-zA-Z0-9._-]+)/g) ?? [];
  return Array.from(new Set(mentions.map((entry) => entry.slice(1).toLowerCase())));
}

type MentionCandidate = {
  id: string;
  email?: string | null;
  username?: string | null;
  name?: string | null;
};

export function resolveMentionedUserIds(text: string, candidates: MentionCandidate[]) {
  const handles = extractMentionHandles(text);
  if (!handles.length) return [];

  const lookup = new Map<string, string>();
  for (const candidate of candidates) {
    const keys = new Set<string>();
    keys.add(candidate.id.toLowerCase());
    if (candidate.username) keys.add(candidate.username.toLowerCase());
    if (candidate.email) {
      keys.add(candidate.email.toLowerCase());
      keys.add(candidate.email.split("@")[0].toLowerCase());
    }
    if (candidate.name) {
      keys.add(candidate.name.toLowerCase().replace(/\s+/g, ""));
      for (const part of candidate.name.split(" ")) {
        if (part.trim()) keys.add(part.toLowerCase());
      }
    }
    for (const key of keys) lookup.set(key, candidate.id);
  }

  const mentionedIds = handles
    .map((handle) => lookup.get(handle))
    .filter((id): id is string => Boolean(id));

  return Array.from(new Set(mentionedIds));
}
