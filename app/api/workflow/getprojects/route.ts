import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/db";
import { accessibleProjectsWhere } from "@/lib/project-access";

const CLOSED_STATUSES = [
  "Done",
  "done",
  "Closed",
  "closed",
  "Completed",
  "completed",
  "Resolved",
  "resolved",
  "Cancelled",
  "cancelled",
];

function toCountMap(
  rows: { projectId: string; _count: { _all: number } }[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(r.projectId, r._count._all);
  }
  return m;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const userID = session.user.id;

  const where = await accessibleProjectsWhere(userID);

  const projects = await prisma.project.findMany({
    where,
    orderBy: { title: "asc" },
    include: {
      creator: { select: { name: true, email: true } },
    },
  });

  if (projects.length === 0) {
    return Response.json([]);
  }

  const ids = projects.map((p) => p.id);
  const now = new Date();

  const [incidentTickets, changeTickets, slaAtRisk] = await Promise.all([
    prisma.issue.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ids }, ticketType: "INCIDENT" },
      _count: { _all: true },
    }),
    prisma.issue.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ids }, ticketType: "CHANGE" },
      _count: { _all: true },
    }),
    prisma.issue.groupBy({
      by: ["projectId"],
      where: {
        projectId: { in: ids },
        slaDueAt: { lt: now },
        OR: [{ status: null }, { status: { notIn: CLOSED_STATUSES } }],
      },
      _count: { _all: true },
    }),
  ]);

  const im = toCountMap(incidentTickets);
  const cm = toCountMap(changeTickets);
  const sm = toCountMap(slaAtRisk);

  const payload = projects.map((p) => ({
    ...p,
    stats: {
      incidentTickets: im.get(p.id) ?? 0,
      changeTickets: cm.get(p.id) ?? 0,
      slaAtRisk: sm.get(p.id) ?? 0,
    },
  }));

  return Response.json(payload);
}
