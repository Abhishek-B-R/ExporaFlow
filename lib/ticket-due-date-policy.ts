import { TicketUrgency } from "@prisma/client";
import {
  addBusinessDays,
  addCalendarHours,
  DEFAULT_BUSINESS_HOLIDAYS,
} from "@/lib/business-days";
import { isChangeManagementType } from "@/lib/ticket-types";
import { TicketType } from "@prisma/client";

type PriorityLevel = "Low" | "Medium" | "High" | "Critical";
type UrgencyLevel = "Low" | "Medium" | "High";

type SlaRule =
  | { kind: "hours"; value: number }
  | { kind: "businessDays"; value: number };

/** Industry SLA matrix from product spec (priority × urgency). */
const SLA_MATRIX: Record<PriorityLevel, Record<UrgencyLevel, SlaRule>> = {
  Critical: {
    High: { kind: "hours", value: 4 },
    Medium: { kind: "hours", value: 8 },
    Low: { kind: "businessDays", value: 1 },
  },
  High: {
    High: { kind: "businessDays", value: 1 },
    Medium: { kind: "businessDays", value: 2 },
    Low: { kind: "businessDays", value: 3 },
  },
  Medium: {
    High: { kind: "businessDays", value: 3 },
    Medium: { kind: "businessDays", value: 5 },
    Low: { kind: "businessDays", value: 7 },
  },
  Low: {
    High: { kind: "businessDays", value: 7 },
    Medium: { kind: "businessDays", value: 10 },
    Low: { kind: "businessDays", value: 14 },
  },
};

const PRIORITY_ALIASES: Record<string, PriorityLevel> = {
  critical: "Critical",
  urgent: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  "no priority": "Medium",
  nopriority: "Medium",
};

export function normalizePriorityLabel(
  priority: string | null | undefined,
): PriorityLevel {
  if (!priority?.trim()) return "Medium";
  const key = priority.trim().toLowerCase();
  return PRIORITY_ALIASES[key] ?? ("Medium" as PriorityLevel);
}

export function normalizeUrgencyLevel(
  urgency: TicketUrgency,
): UrgencyLevel {
  if (urgency === TicketUrgency.LOW) return "Low";
  if (urgency === TicketUrgency.HIGH || urgency === TicketUrgency.CRITICAL) {
    return "High";
  }
  return "Medium";
}

export function resolveSlaRule(params: {
  urgency: TicketUrgency;
  priority: string | null | undefined;
}): SlaRule {
  const priority = normalizePriorityLabel(params.priority);
  const urgency = normalizeUrgencyLevel(params.urgency);
  return SLA_MATRIX[priority][urgency];
}

export function computeDueDateFromPolicy(params: {
  urgency: TicketUrgency;
  priority: string | null | undefined;
  baseDate?: Date;
  ticketType?: TicketType;
  holidays?: readonly string[];
}): Date | null {
  if (isChangeManagementType(params.ticketType)) return null;
  const rule = resolveSlaRule({
    urgency: params.urgency,
    priority: params.priority,
  });
  const base = params.baseDate ?? new Date();
  const holidays = params.holidays ?? DEFAULT_BUSINESS_HOLIDAYS;
  if (rule.kind === "hours") {
    return addCalendarHours(base, rule.value);
  }
  return addBusinessDays(base, rule.value, holidays);
}

export const URGENCY_OPTIONS: { value: TicketUrgency; label: string }[] = [
  { value: TicketUrgency.LOW, label: "Low" },
  { value: TicketUrgency.MEDIUM, label: "Medium" },
  { value: TicketUrgency.HIGH, label: "High" },
];

export const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

/** @deprecated Use resolveSlaRule — kept for callers expecting hour counts. */
export function hoursUntilDue(params: {
  urgency: TicketUrgency;
  priority: string | null | undefined;
}): number {
  const rule = resolveSlaRule(params);
  if (rule.kind === "hours") return rule.value;
  return rule.value * 24;
}
