import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ viewId: string }> },
) {
  const { viewId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { name, description, filters } = await request.json();
  const existing = await prisma.savedView.findUnique({
    where: { id: viewId },
    select: { ownerId: true },
  });
  if (!existing || existing.ownerId !== session.user.id) {
    return Response.json({ message: "View not found." }, { status: 404 });
  }

  const updated = await prisma.savedView.update({
    where: { id: viewId },
    data: {
      name: typeof name === "string" ? name.trim() : undefined,
      description: typeof description === "string" ? description.trim() : undefined,
      filters: typeof filters === "object" ? (filters as object) : undefined,
    },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ viewId: string }> },
) {
  const { viewId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const existing = await prisma.savedView.findUnique({
    where: { id: viewId },
    select: { ownerId: true },
  });
  if (!existing || existing.ownerId !== session.user.id) {
    return Response.json({ message: "View not found." }, { status: 404 });
  }

  await prisma.savedView.delete({
    where: { id: viewId },
  });

  return Response.json({ message: "Saved view deleted." });
}
