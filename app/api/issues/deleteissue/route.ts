import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return Response.json({ message: "Kindly log in!" }, { status: 401 });
  }

  const { issueId } = await request.json();

  if (!issueId) {
    return Response.json({ message: "issueId is required." }, { status: 400 });
  }

  // Find the issue to get its projectId
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { projectId: true },
  });

  if (!issue) {
    return Response.json({ message: "Issue not found." }, { status: 404 });
  }

  // Ensure the user has permission to delete the issue (ENGINEER or ADMIN)
  const access = await assertProjectRole({
    userId: session.user.id,
    projectId: issue.projectId,
    minimum: Role.ENGINEER,
  });

  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  try {
    await prisma.issue.delete({
      where: { id: issueId },
    });

    return Response.json({ message: "Issue deleted successfully." });
  } catch (error) {
    console.error("Failed to delete issue:", error);
    return Response.json({ message: "Failed to delete issue." }, { status: 500 });
  }
}
