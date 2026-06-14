import { isChangeManagementType } from "@/lib/ticket-types";

export function buildTicketDetailPath(params: {
  projectId: string;
  issueId: string;
  ticketType?: string | null;
}): string {
  const segment = isChangeManagementType(params.ticketType)
    ? "change-tickets"
    : "incident-tickets";
  return `/workflow/project/${params.projectId}/${segment}/${params.issueId}`;
}

export function buildTicketAbsoluteUrl(params: {
  projectId: string;
  issueId: string;
  ticketType?: string | null;
  baseUrl?: string;
}): string {
  const base =
    params.baseUrl?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}${buildTicketDetailPath(params)}`;
}
