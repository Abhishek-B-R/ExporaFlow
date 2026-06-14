import { TicketType } from "@prisma/client";
import { isChangeManagementType } from "@/lib/ticket-types";

export const HOLD_STATUS = "Hold";

export const ISSUE_STATUSES = [
  "Backlog",
  "Planned",
  "Working",
  "Completed",
  "Cancelled",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

const BASE_LIST = ISSUE_STATUSES as readonly string[];
const CHANGE_LIST = [...BASE_LIST, HOLD_STATUS] as readonly string[];

export function statusesForTicketType(ticketType: TicketType): readonly string[] {
  return isChangeManagementType(ticketType) ? CHANGE_LIST : BASE_LIST;
}

export function isValidIssueStatusForType(
  value: unknown,
  ticketType: TicketType,
): value is string {
  return typeof value === "string" && statusesForTicketType(ticketType).includes(value);
}

export function isValidIssueStatus(value: unknown): value is IssueStatus {
  return typeof value === "string" && BASE_LIST.includes(value);
}

export function canTransitionIssueStatus(params: {
  from: string | null | undefined;
  to: string | null | undefined;
  ticketType?: TicketType;
}): boolean {
  const { from, to, ticketType = TicketType.INCIDENT } = params;
  const allowed = statusesForTicketType(ticketType);
  if (typeof to !== "string" || !allowed.includes(to)) return false;
  if (typeof from === "undefined" || from === null || from === "") {
    return true;
  }
  return typeof from === "string" && allowed.includes(from);
}
