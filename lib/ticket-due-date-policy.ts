import { TicketUrgency, TicketType } from "@prisma/client";

/**
 * Edit this file to tune how due dates are calculated from urgency + priority.
 * Values are hours from ticket creation (or from `baseDate` when recomputing).
 */
export const TICKET_DUE_DATE_POLICY = {
  /** Incident tickets use this matrix. Change tickets keep start/end SLA logic. */
  incident: {
    CRITICAL: {
      Urgent: 2,
      High: 4,
      Medium: 8,
      Low: 12,
      "No Priority": 24,
    },
    HIGH: {
      Urgent: 4,
      High: 8,
      Medium: 24,
      Low: 48,
      "No Priority": 72,
    },
    MEDIUM: {
      Urgent: 8,
      High: 24,
      Medium: 48,
      Low: 72,
      "No Priority": 120,
    },
    LOW: {
      Urgent: 24,
      High: 48,
      Medium: 72,
      Low: 120,
      "No Priority": 168,
    },
  } satisfies Record<
    TicketUrgency,
    Record<string, number>
  >,
} as const;

const PRIORITY_ALIASES: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  "no priority": "No Priority",
  nopriority: "No Priority",
};

export function normalizePriorityLabel(priority: string | null | undefined): string {
  if (!priority?.trim()) return "No Priority";
  const key = priority.trim().toLowerCase();
  return PRIORITY_ALIASES[key] ?? priority.trim();
}

export function hoursUntilDue(params: {
  urgency: TicketUrgency;
  priority: string | null | undefined;
}): number {
  const matrix = TICKET_DUE_DATE_POLICY.incident[params.urgency] as Record<
    string,
    number
  >;
  const label = normalizePriorityLabel(params.priority);
  return matrix[label] ?? matrix["No Priority"] ?? 72;
}

/** Compute due date for incident tickets from urgency + priority. */
export function computeDueDateFromPolicy(params: {
  urgency: TicketUrgency;
  priority: string | null | undefined;
  baseDate?: Date;
  ticketType?: TicketType;
}): Date | null {
  if (params.ticketType === TicketType.CHANGE) return null;
  const hours = hoursUntilDue({
    urgency: params.urgency,
    priority: params.priority,
  });
  const base = params.baseDate ?? new Date();
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

export const URGENCY_OPTIONS: { value: TicketUrgency; label: string }[] = [
  { value: TicketUrgency.LOW, label: "Low" },
  { value: TicketUrgency.MEDIUM, label: "Medium" },
  { value: TicketUrgency.HIGH, label: "High" },
  { value: TicketUrgency.CRITICAL, label: "Critical" },
];
