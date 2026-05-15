import type { Prisma } from "@prisma/client";
import { TicketType } from "@prisma/client";

export const HOLD_STATUS = "Hold";

/** Parse `YYYY-MM-DD` as UTC noon to reduce timezone drift in storage. */
export function parseStoredDate(value: string | null | undefined): Date | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00.000Z`);
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateForInput(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Initial SLA deadline for change tickets: prefer explicit end date,
 * otherwise start + duration.
 */
export function computeInitialSlaDueAt(params: {
  startDate: Date | null;
  endDate: Date | null;
  durationMinutes: number | null;
}): Date | null {
  if (params.endDate) return params.endDate;
  if (params.startDate && params.durationMinutes) {
    return new Date(
      params.startDate.getTime() + params.durationMinutes * 60_000,
    );
  }
  return null;
}

type IssueSlaFields = {
  ticketType: TicketType;
  status: string | null;
  holdStartedAt: Date | null;
  accumulatedHoldSeconds: number;
  slaDueAt: Date | null;
};

/**
 * When status changes, update hold tracking and extend SLA deadline after hold.
 */
export function buildHoldAndSlaPatch(params: {
  existing: IssueSlaFields;
  nextStatus: string | undefined;
}): Pick<
  Prisma.IssueUpdateInput,
  "holdStartedAt" | "accumulatedHoldSeconds" | "slaDueAt"
> {
  const { existing, nextStatus } = params;
  if (typeof nextStatus === "undefined") return {};

  const prev = existing.status ?? "";
  const next = nextStatus;
  const patch: Pick<
    Prisma.IssueUpdateInput,
    "holdStartedAt" | "accumulatedHoldSeconds" | "slaDueAt"
  > = {};

  if (existing.ticketType !== TicketType.CHANGE) {
    return {};
  }

  const now = Date.now();

  if (next === HOLD_STATUS && prev !== HOLD_STATUS) {
    patch.holdStartedAt = new Date(now);
    return patch;
  }

  if (prev === HOLD_STATUS && next !== HOLD_STATUS) {
    if (existing.holdStartedAt) {
      const holdMs = now - existing.holdStartedAt.getTime();
      const addSec = Math.max(0, Math.floor(holdMs / 1000));
      patch.accumulatedHoldSeconds = existing.accumulatedHoldSeconds + addSec;
      patch.holdStartedAt = null;
      if (existing.slaDueAt) {
        patch.slaDueAt = new Date(existing.slaDueAt.getTime() + holdMs);
      }
    }
    return patch;
  }

  return {};
}

export function isSlaBreached(issue: {
  slaDueAt: Date | null;
  status: string | null;
  ticketType: TicketType;
}): boolean {
  if (!issue.slaDueAt) return false;
  if (issue.status === HOLD_STATUS) return false;
  if (issue.status === "Completed" || issue.status === "Cancelled") return false;
  return Date.now() > issue.slaDueAt.getTime();
}

export function totalHoldMsLive(issue: {
  holdStartedAt: Date | null;
  accumulatedHoldSeconds: number;
}): number {
  let ms = issue.accumulatedHoldSeconds * 1000;
  if (issue.holdStartedAt) {
    ms += Date.now() - issue.holdStartedAt.getTime();
  }
  return ms;
}
