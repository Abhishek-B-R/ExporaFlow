import { authOptions } from "@/lib/auth";
import { getUserProjectRole } from "@/lib/authz";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return Response.json({ message: "projectId is required." }, { status: 400 });
  }

  const role = await getUserProjectRole({
    userId: session.user.id,
    projectId,
  });

  return Response.json({ role });
}
