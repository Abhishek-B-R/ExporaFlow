import { prisma } from "@/db";
import { Resend } from "resend";
import { formatTicketKey } from "@/lib/ticket-display";
import { TicketType } from "@prisma/client";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_your")) return null;
  return new Resend(key);
}

export async function sendMentionEmails(params: {
  mentionedUserIds: string[];
  actorId: string;
  issueId: string;
  projectId: string;
  issueTitle: string;
  commentBody: string;
  ticketType: TicketType;
  ticketNumber: number;
}) {
  const uniqueIds = Array.from(new Set(params.mentionedUserIds)).filter(
    (id) => id && id !== params.actorId,
  );
  if (uniqueIds.length === 0) return { sent: 0, skipped: 0 };

  const resend = getResend();
  if (!resend) {
    console.warn("Mention email skipped: RESEND_API_KEY not configured.");
    return { sent: 0, skipped: uniqueIds.length };
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
      ticketType: params.ticketType,
      ticketNumber: params.ticketNumber,
    }) ?? params.issueId.slice(0, 8);

  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const ticketUrl = `${baseUrl}/workflow/project/${params.projectId}/incident-tickets/${params.issueId}`;
  const actorLabel = actor?.name || actor?.email || "Someone";
  const projectLabel = project?.title ?? "Project";

  let sent = 0;
  for (const user of recipients) {
    if (!user.email) continue;
    try {
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ?? "ExporaFlow <notifications@exporaflow.com>",
        to: user.email,
        subject: `${actorLabel} mentioned you on ${ticketKey}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #555;">
              <strong>${actorLabel}</strong> mentioned you in a comment on
              <strong>${ticketKey}</strong> (${projectLabel}).
            </p>
            <p style="margin: 0 0 12px; font-size: 14px; color: #111; font-weight: 600;">${params.issueTitle}</p>
            <blockquote style="margin: 0 0 16px; padding: 12px; background: #f0f9ff; border-left: 3px solid #0ea5e9; color: #334155; font-size: 14px; white-space: pre-wrap;">${escapeHtml(params.commentBody)}</blockquote>
            <a href="${ticketUrl}" style="display: inline-block; padding: 8px 14px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">View ticket</a>
          </div>
        `,
      });
      sent += 1;
    } catch (error) {
      console.error("Failed to send mention email:", user.email, error);
    }
  }

  return { sent, skipped: uniqueIds.length - sent };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
