import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const projectIds = await prisma.project.findMany({
    where: {
      OR: [{ createdBy: session.user.id }, { projectMembers: { some: { userId: session.user.id } } }],
    },
    select: { id: true },
  });

  const ids = projectIds.map((p) => p.id);
  if (ids.length === 0) return Response.json([]);

  const issues = await prisma.issue.findMany({
    where: { projectId: { in: ids } },
    include: {
      Project: { select: { title: true, id: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return Response.json(issues);
}

