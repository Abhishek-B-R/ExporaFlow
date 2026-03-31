import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const issues = await prisma.issue.findMany({
    where: {
      OR: [{ assignedUser: session.user.id }, { Project: { createdBy: session.user.id } }],
    },
    include: {
      Project: {
        select: { id: true, title: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json(issues);
}

