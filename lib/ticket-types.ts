import { TicketType } from "@prisma/client";

/** Types that use change-management workflow (Hold status, start/end SLA). */
export function isChangeManagementType(
  ticketType: TicketType | string | null | undefined,
): boolean {
  return (
    ticketType === TicketType.CHANGE ||
    ticketType === TicketType.CHANGE_REQUEST ||
    ticketType === "CHANGE" ||
    ticketType === "CHANGE_REQUEST"
  );
}

export const ALL_TICKET_TYPES: TicketType[] = [
  TicketType.INCIDENT,
  TicketType.SERVICE_REQUEST,
  TicketType.PROBLEM,
  TicketType.CHANGE,
  TicketType.CHANGE_REQUEST,
  TicketType.TASK,
  TicketType.BUG,
  TicketType.ENHANCEMENT,
];
