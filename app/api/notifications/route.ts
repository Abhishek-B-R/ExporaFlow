import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const items = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      issue: { select: { id: true, title: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(items);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { ids, markAll } = await request.json();

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return Response.json({ message: "All notifications marked as read." });
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ message: "ids array is required." }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId: session.user.id,
    },
    data: { readAt: new Date() },
  });

  return Response.json({ message: "Notifications marked as read." });
}
