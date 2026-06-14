import { TicketType } from "@prisma/client";

const LABELS: Record<TicketType, string> = {
  [TicketType.INCIDENT]: "Incident",
  [TicketType.SERVICE_REQUEST]: "Service Request",
  [TicketType.PROBLEM]: "Problem",
  [TicketType.CHANGE]: "Change",
  [TicketType.CHANGE_REQUEST]: "Change Request",
  [TicketType.TASK]: "Task",
  [TicketType.BUG]: "Bug",
  [TicketType.ENHANCEMENT]: "Enhancement",
};

export function ticketTypeLabel(type: TicketType | string | null | undefined): string {
  if (!type) return "Incident";
  return LABELS[type as TicketType] ?? String(type);
}

export function ticketTypeBadgeClass(type: TicketType | string | null | undefined): string {
  const t = String(type ?? TicketType.INCIDENT);
  if (t.includes("INCIDENT") || t === "BUG") {
    return "bg-rose-50 text-rose-800 border-rose-200";
  }
  if (t.includes("CHANGE")) return "bg-violet-50 text-violet-800 border-violet-200";
  if (t.includes("SERVICE")) return "bg-sky-50 text-sky-800 border-sky-200";
  if (t.includes("PROBLEM")) return "bg-amber-50 text-amber-800 border-amber-200";
  if (t.includes("ENHANCEMENT")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (t.includes("TASK")) return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export const TICKET_TYPE_OPTIONS = Object.entries(LABELS).map(([value, label]) => ({
  value: value as TicketType,
  label,
}));
