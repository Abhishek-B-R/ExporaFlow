import { prisma } from "@/db";

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

export async function sendIntegrationNotification(params: {
  channel: OutboundChannel;
  title: string;
  body?: string;
  issueId?: string;
  projectId?: string;
}) {
  const text = `${params.title}${params.body ? `\n${params.body}` : ""}`;

  if (params.channel === "slack" && process.env.SLACK_WEBHOOK_URL) {
    await postWebhook(process.env.SLACK_WEBHOOK_URL, { text });
    return { sent: true, channel: "slack" as const };
  }

  if (params.channel === "teams" && process.env.TEAMS_WEBHOOK_URL) {
    await postWebhook(process.env.TEAMS_WEBHOOK_URL, { text });
    return { sent: true, channel: "teams" as const };
  }

  const recipients = await prisma.notification.findMany({
    where: { ...(params.projectId ? { projectId: params.projectId } : {}) },
    select: { userId: true },
    take: 20,
  });

  return {
    sent: false,
    channel: "email" as const,
    reason: "No external webhook configured; email fallback requires SMTP/Resend setup.",
    intendedRecipientCount: recipients.length,
  };
}
