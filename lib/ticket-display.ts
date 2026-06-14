import { TicketType } from "@prisma/client";

const GLOBAL_PREFIX = "EXP";

export function formatGlobalTicketKey(
  globalTicketNumber: number | null | undefined,
): string | null {
  if (typeof globalTicketNumber !== "number" || globalTicketNumber <= 0) {
    return null;
  }
  return `${GLOBAL_PREFIX}-${String(globalTicketNumber).padStart(6, "0")}`;
}

/** Legacy per-project INC/CHG key (fallback when global number missing). */
export function formatLegacyTicketKey(params: {
  ticketType: TicketType | string | null | undefined;
  ticketNumber: number | null | undefined;
}): string | null {
  const n = params.ticketNumber;
  if (typeof n !== "number" || n <= 0) return null;
  const prefix =
    params.ticketType === TicketType.CHANGE ||
    params.ticketType === TicketType.CHANGE_REQUEST ||
    params.ticketType === "CHANGE" ||
    params.ticketType === "CHANGE_REQUEST"
      ? "CHG"
      : "INC";
  return `${prefix}-${n}`;
}

/** Preferred display key: global EXP-000001, then legacy INC/CHG. */
export function formatTicketKey(params: {
  globalTicketNumber?: number | null;
  ticketType?: TicketType | string | null;
  ticketNumber?: number | null;
}): string | null {
  return (
    formatGlobalTicketKey(params.globalTicketNumber) ??
    formatLegacyTicketKey({
      ticketType: params.ticketType,
      ticketNumber: params.ticketNumber,
    })
  );
}

/** Match ticket search query against UUID or EXP/INC/CHG keys. */
export function ticketMatchesSearch(params: {
  query: string;
  issueId: string;
  globalTicketNumber?: number | null;
  ticketType?: TicketType | string | null;
  ticketNumber?: number | null;
}): boolean {
  const q = params.query.trim().toLowerCase();
  if (!q) return true;
  if (params.issueId.toLowerCase().includes(q)) return true;

  const globalKey = formatGlobalTicketKey(params.globalTicketNumber);
  if (globalKey?.toLowerCase().includes(q)) return true;

  const legacyKey = formatLegacyTicketKey({
    ticketType: params.ticketType,
    ticketNumber: params.ticketNumber,
  });
  if (legacyKey?.toLowerCase().includes(q)) return true;

  const numeric = q.replace(/^exp-?/, "");
  if (/^\d+$/.test(numeric) && params.globalTicketNumber === Number(numeric)) {
    return true;
  }

  return false;
}
