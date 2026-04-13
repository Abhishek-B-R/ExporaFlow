import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      issue: { select: { id: true, title: true } },
      project: { select: { title: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(notifications);
}

