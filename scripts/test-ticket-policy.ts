import assert from "node:assert/strict";
import { addBusinessDays, addCalendarHours } from "../lib/business-days";
import {
  computeDueDateFromPolicy,
  normalizePriorityLabel,
  resolveSlaRule,
} from "../lib/ticket-due-date-policy";
import {
  formatGlobalTicketKey,
  formatTicketKey,
  ticketMatchesSearch,
} from "../lib/ticket-display";
import { TicketType, TicketUrgency } from "@prisma/client";

assert.equal(formatGlobalTicketKey(1), "EXP-000001");
assert.equal(formatGlobalTicketKey(42), "EXP-000042");
assert.equal(
  formatTicketKey({
    globalTicketNumber: 7,
    ticketType: TicketType.INCIDENT,
    ticketNumber: 3,
  }),
  "EXP-000007",
);

assert.equal(normalizePriorityLabel("urgent"), "Critical");
assert.equal(normalizePriorityLabel("high"), "High");

const criticalHigh = resolveSlaRule({
  urgency: TicketUrgency.HIGH,
  priority: "Critical",
});
assert.equal(criticalHigh.kind, "hours");
assert.equal(criticalHigh.kind === "hours" ? criticalHigh.value : 0, 4);

const base = new Date("2026-05-20T09:00:00.000Z");
const dueHours = computeDueDateFromPolicy({
  urgency: TicketUrgency.HIGH,
  priority: "Critical",
  baseDate: base,
  ticketType: TicketType.INCIDENT,
});
assert.equal(
  dueHours?.toISOString(),
  addCalendarHours(base, 4).toISOString(),
);

const dueDays = computeDueDateFromPolicy({
  urgency: TicketUrgency.LOW,
  priority: "High",
  baseDate: base,
  ticketType: TicketType.INCIDENT,
});
assert.equal(
  dueDays?.toISOString(),
  addBusinessDays(base, 3).toISOString(),
);

assert.equal(
  ticketMatchesSearch({
    query: "exp-000042",
    issueId: "uuid",
    globalTicketNumber: 42,
    ticketNumber: 1,
    ticketType: TicketType.INCIDENT,
  }),
  true,
);

console.log("All ticket policy tests passed.");
