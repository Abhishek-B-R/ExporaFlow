import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { assertProjectRole } from "@/lib/authz";
import { Role } from "@prisma/client";
import { findDuplicateIssueCandidates } from "@/lib/ai/duplicates";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { projectId, title, description } = await request.json();
  if (!projectId || !title) {
    return Response.json({ message: "projectId and title are required." }, { status: 400 });
  }

  const access = await assertProjectRole({
    userId: session.user.id,
    projectId,
    minimum: Role.VIEWER,
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  const duplicates = await findDuplicateIssueCandidates({ projectId, title, description });
  return Response.json({ duplicates });
}
