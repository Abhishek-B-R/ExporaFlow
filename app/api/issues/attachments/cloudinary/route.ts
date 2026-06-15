import { authOptions } from "@/lib/auth";
import { assertProjectPermission } from "@/lib/authz";
import { prisma } from "@/db";
import { cloudinaryMediaSchema } from "@/lib/ticket-schemas";
import { saveCloudinaryAttachments } from "@/lib/save-cloudinary-attachments";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  issueId: z.string().min(1),
  media: cloudinaryMediaSchema,
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ message: "Invalid media payload." }, { status: 400 });
  }

  const { issueId, media } = parsed.data;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { projectId: true },
  });
  if (!issue) {
    return Response.json({ message: "Ticket not found." }, { status: 404 });
  }

  const access = await assertProjectPermission({
    userId: session.user.id,
    projectId: issue.projectId,
    permission: "uploadAttachment",
  });
  if (!access.ok) {
    return Response.json({ message: access.message }, { status: access.status });
  }

  const [row] = await saveCloudinaryAttachments({
    issueId,
    uploadedById: session.user.id,
    media: [media],
  });

  return Response.json(row, { status: 201 });
}
