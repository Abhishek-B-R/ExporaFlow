import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { accessibleProjectsWhere } from "@/lib/project-access";
import { TicketType } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const whereProjects = await accessibleProjectsWhere(userId);
  const projects = await prisma.project.findMany({
    where: whereProjects,
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return Response.json({
      incidentOpen: 0,
      changeOpen: 0,
      onHoldChange: 0,
      slaBreaches: 0,
      activeCustomers: 0,
      employees: 0,
      projects: 0,
    });
  }

  const baseIssue = { projectId: { in: projectIds } };
  const openNotDone = {
    ...baseIssue,
    NOT: { status: { in: ["Completed", "Cancelled"] } },
  };

  const [
    incidentOpen,
    changeOpen,
    onHoldChange,
    slaBreaches,
    activeCustomers,
    employees,
  ] = await Promise.all([
    prisma.issue.count({
      where: {
        ...openNotDone,
        ticketType: TicketType.INCIDENT,
      },
    }),
    prisma.issue.count({
      where: {
        ...openNotDone,
        ticketType: TicketType.CHANGE,
      },
    }),
    prisma.issue.count({
      where: {
        ...baseIssue,
        ticketType: TicketType.CHANGE,
        status: "Hold",
      },
    }),
    prisma.issue.count({
      where: {
        ...openNotDone,
        ticketType: TicketType.CHANGE,
        slaDueAt: { not: null, lt: new Date() },
        NOT: { status: { in: ["Hold", "Completed", "Cancelled"] } },
      },
    }),
    prisma.customer.count(),
    prisma.employee.count(),
  ]);

  return Response.json({
    incidentOpen,
    changeOpen,
    onHoldChange,
    slaBreaches,
    activeCustomers,
    employees,
    projects: projectIds.length,
  });
}
