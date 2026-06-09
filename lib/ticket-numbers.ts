import { prisma } from "@/db";

/** Next sequential ticket number within a project. */
export async function allocateTicketNumber(projectId: string): Promise<number> {
  const agg = await prisma.issue.aggregate({
    where: { projectId },
    _max: { ticketNumber: true },
  });
  return (agg._max.ticketNumber ?? 0) + 1;
}
