import { prisma } from "@/db";

/** Next sequential ticket number within a project (legacy INC/CHG). */
export async function allocateTicketNumber(projectId: string): Promise<number> {
  const agg = await prisma.issue.aggregate({
    where: { projectId },
    _max: { ticketNumber: true },
  });
  return (agg._max.ticketNumber ?? 0) + 1;
}

/** Next global EXP-000001 sequence (atomic). */
export async function allocateGlobalTicketNumber(): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.globalTicketSequence.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    return updated.lastNumber;
  });
}
