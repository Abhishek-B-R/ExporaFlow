import { prisma } from "@/db";
import { formatTicketKey } from "@/lib/ticket-display";
import { buildTicketAbsoluteUrl } from "@/lib/ticket-url";
import { ticketTypeLabel } from "@/lib/ticket-type-labels";
import { TicketType } from "@prisma/client";
import { Resend } from "resend";

export type MentionSourceType =
  | "comment"
  | "description_create"
  | "description_update";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_your")) return null;
  return new Resend(key);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildDedupeKey(params: {
  issueId: string;
  mentionedUserId: string;
  sourceType: MentionSourceType;
  sourceId: string;
}) {
  return `${params.issueId}:${params.mentionedUserId}:${params.sourceType}:${params.sourceId}`;
}

/** Queue mention emails asynchronously; skips duplicates via MentionEmailLog. */
export function queueMentionEmails(params: {
  mentionedUserIds: string[];
  actorId: string;
  issueId: string;
  projectId: string;
  issueTitle: string;
  excerpt: string;
  ticketType: TicketType;
  ticketNumber: number;
  globalTicketNumber?: number | null;
  sourceType: MentionSourceType;
  sourceId: string;
}) {
  void processMentionEmailQueue(params).catch((error) => {
    console.error("Mention email queue failed:", error);
  });
}

async function processMentionEmailQueue(params: {
  mentionedUserIds: string[];
  actorId: string;
  issueId: string;
  projectId: string;
  issueTitle: string;
  excerpt: string;
  ticketType: TicketType;
  ticketNumber: number;
  globalTicketNumber?: number | null;
  sourceType: MentionSourceType;
  sourceId: string;
}) {
  const uniqueIds = Array.from(new Set(params.mentionedUserIds)).filter(
    (id) => id && id !== params.actorId,
  );
  if (uniqueIds.length === 0) return;

  const resend = getResend();
  if (!resend) {
    console.warn("Mention email skipped: RESEND_API_KEY not configured.");
    return;
  }

  const [actor, recipients, project] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.actorId },
      select: { name: true, email: true },
    }),
    prisma.user.findMany({
      where: { id: { in: uniqueIds }, email: { not: null } },
      select: { id: true, email: true, name: true },
    }),
    prisma.project.findUnique({
      where: { id: params.projectId },
      select: { title: true },
    }),
  ]);

  const ticketKey =
    formatTicketKey({
      globalTicketNumber: params.globalTicketNumber,
      ticketType: params.ticketType,
      ticketNumber: params.ticketNumber,
    }) ?? params.issueId.slice(0, 8);

  const ticketUrl = buildTicketAbsoluteUrl({
    projectId: params.projectId,
    issueId: params.issueId,
    ticketType: params.ticketType,
  });

  const actorLabel = actor?.name || actor?.email || "Someone";
  const projectLabel = project?.title ?? "Project";
  const typeLabel = ticketTypeLabel(params.ticketType);

  for (const user of recipients) {
    if (!user.email) continue;

    const dedupeKey = buildDedupeKey({
      issueId: params.issueId,
      mentionedUserId: user.id,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    });

    const existing = await prisma.mentionEmailLog.findUnique({
      where: { dedupeKey },
      select: { id: true, status: true },
    });
    if (existing?.status === "sent") continue;

    const logRow =
      existing ??
      (await prisma.mentionEmailLog.create({
        data: {
          issueId: params.issueId,
          mentionedUserId: user.id,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          dedupeKey,
          status: "pending",
        },
      }));

    try {
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ??
          "ExporaFlow <notifications@exporaflow.com>",
        to: user.email,
        subject: `${actorLabel} mentioned you on ${ticketKey}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #555;">
              <strong>${actorLabel}</strong> mentioned you on ticket
              <strong>${ticketKey}</strong>.
            </p>
            <table style="margin: 0 0 12px; font-size: 13px; color: #334155; border-collapse: collapse;">
              <tr><td style="padding: 2px 8px 2px 0; color: #64748b;">Ticket</td><td><strong>${escapeHtml(ticketKey)}</strong></td></tr>
              <tr><td style="padding: 2px 8px 2px 0; color: #64748b;">Title</td><td>${escapeHtml(params.issueTitle)}</td></tr>
              <tr><td style="padding: 2px 8px 2px 0; color: #64748b;">Project</td><td>${escapeHtml(projectLabel)}</td></tr>
              <tr><td style="padding: 2px 8px 2px 0; color: #64748b;">Type</td><td>${escapeHtml(typeLabel)}</td></tr>
            </table>
            <blockquote style="margin: 0 0 16px; padding: 12px; background: #f0f9ff; border-left: 3px solid #0ea5e9; color: #334155; font-size: 14px; white-space: pre-wrap;">${escapeHtml(params.excerpt)}</blockquote>
            <a href="${ticketUrl}" style="display: inline-block; padding: 8px 14px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">View ticket</a>
          </div>
        `,
      });

      await prisma.mentionEmailLog.update({
        where: { id: logRow.id },
        data: { status: "sent", sentAt: new Date(), errorMessage: null },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown send error";
      await prisma.mentionEmailLog.update({
        where: { id: logRow.id },
        data: { status: "failed", errorMessage: message },
      });
      console.error("Failed to send mention email:", user.email, error);
    }
  }
}

/** @deprecated Use queueMentionEmails */
export async function sendMentionEmails(params: {
  mentionedUserIds: string[];
  actorId: string;
  issueId: string;
  projectId: string;
  issueTitle: string;
  commentBody: string;
  ticketType: TicketType;
  ticketNumber: number;
  globalTicketNumber?: number | null;
}) {
  queueMentionEmails({
    ...params,
    excerpt: params.commentBody,
    sourceType: "comment",
    sourceId: params.issueId,
  });
  return { sent: 0, skipped: 0 };
}
