import { prisma } from "../db";

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, title: true, _count: { select: { issues: true } } },
    take: 10,
  });
  console.log("Projects:", projects);

  const issues = await prisma.issue.findMany({
    select: {
      id: true,
      title: true,
      globalTicketNumber: true,
      ticketType: true,
      projectId: true,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  console.log("Issues:", issues);
}

main()
  .finally(() => prisma.$disconnect());
