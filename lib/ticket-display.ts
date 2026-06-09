import { TicketType } from "@prisma/client";

export function formatTicketKey(params: {
  ticketType: TicketType | string | null | undefined;
  ticketNumber: number | null | undefined;
}): string | null {
  const n = params.ticketNumber;
  if (typeof n !== "number" || n <= 0) return null;
  const prefix =
    params.ticketType === TicketType.CHANGE || params.ticketType === "CHANGE"
      ? "CHG"
      : "INC";
  return `${prefix}-${n}`;
}
