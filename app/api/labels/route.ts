import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

/** GET /api/labels — list all labels the user can see (from their workspaces) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Kindly sign in!" }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const labels = await prisma.label.findMany({
    where: { workspaceId: { in: workspaceIds } },
    orderBy: { name: "asc" },
  });

  return Response.json(labels);
}

/** POST /api/labels — create a new label */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Kindly sign in!" }, { status: 401 });
  }

  const { name, color, description } = await request.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json({ message: "Label name is required." }, { status: 400 });
  }

  // Find the user's workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });

  if (!membership) {
    return Response.json({ message: "No workspace found." }, { status: 404 });
  }

  try {
    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        color: color || "#6f86ff",
        description: description || null,
        workspaceId: membership.workspaceId,
      },
    });
    return Response.json(label, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return Response.json({ message: "A label with that name already exists." }, { status: 409 });
    }
    return Response.json({ message: "Failed to create label." }, { status: 500 });
  }
}

/** DELETE /api/labels — delete a label by id */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Kindly sign in!" }, { status: 401 });
  }

  const { labelId } = await request.json();
  if (!labelId) {
    return Response.json({ message: "labelId is required." }, { status: 400 });
  }

  // Verify the label belongs to a workspace the user is in
  const label = await prisma.label.findUnique({
    where: { id: labelId },
    select: { workspaceId: true },
  });
  if (!label) {
    return Response.json({ message: "Label not found." }, { status: 404 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspaceId: label.workspaceId },
  });
  if (!membership) {
    return Response.json({ message: "Not authorized." }, { status: 403 });
  }

  await prisma.label.delete({ where: { id: labelId } });
  return Response.json({ message: "Label deleted." });
}
