import { prisma } from "@/db";
import { Resend } from "resend";

type OutboundChannel = "slack" | "teams" | "email";

async function postWebhook(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Webhook failed: ${response.status} ${body}`);
  }
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_your")) return null;
  return new Resend(key);
}

export async function sendIntegrationNotification(params: {
  channel: OutboundChannel;
  title: string;
  body?: string;
  issueId?: string;
  projectId?: string;
}) {
  const text = `${params.title}${params.body ? `\n${params.body}` : ""}`;

  // ── Slack webhook ──
  if (params.channel === "slack" && process.env.SLACK_WEBHOOK_URL) {
    await postWebhook(process.env.SLACK_WEBHOOK_URL, { text });
    return { sent: true, channel: "slack" as const };
  }

  // ── Teams webhook ──
  if (params.channel === "teams" && process.env.TEAMS_WEBHOOK_URL) {
    await postWebhook(process.env.TEAMS_WEBHOOK_URL, { text });
    return { sent: true, channel: "teams" as const };
  }

  // ── Email via Resend ──
  const resend = getResend();
  if (params.channel === "email" || !process.env.SLACK_WEBHOOK_URL) {
    if (!resend) {
      return {
        sent: false,
        channel: "email" as const,
        reason: "RESEND_API_KEY is not configured.",
      };
    }

    // Get recipient emails from project members
    const recipientEmails: string[] = [];
    if (params.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: params.projectId },
        select: {
          creator: { select: { email: true } },
          projectMembers: {
            select: { user: { select: { email: true } } },
            take: 20,
          },
        },
      });
      if (project?.creator?.email) recipientEmails.push(project.creator.email);
      for (const member of project?.projectMembers ?? []) {
        if (member.user.email) recipientEmails.push(member.user.email);
      }
    }

    const uniqueEmails = Array.from(new Set(recipientEmails)).slice(0, 20);
    if (uniqueEmails.length === 0) {
      return {
        sent: false,
        channel: "email" as const,
        reason: "No email recipients found for this project.",
      };
    }

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "ExporaFlow <notifications@exporaflow.com>",
        to: uniqueEmails,
        subject: params.title,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px;">
            <h2 style="margin: 0 0 8px; font-size: 18px; color: #111;">${params.title}</h2>
            ${params.body ? `<p style="margin: 0 0 16px; color: #555; font-size: 14px; line-height: 1.5;">${params.body}</p>` : ""}
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
            <p style="margin: 0; color: #999; font-size: 12px;">Sent by ExporaFlow</p>
          </div>
        `,
      });
      return { sent: true, channel: "email" as const, recipientCount: uniqueEmails.length };
    } catch (error) {
      return {
        sent: false,
        channel: "email" as const,
        reason: `Email send failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  return {
    sent: false,
    channel: "email" as const,
    reason: "No external webhook configured and email channel not explicitly requested.",
  };
}
