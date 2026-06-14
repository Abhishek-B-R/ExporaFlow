import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db";
import { defaultUsername } from "@/lib/default-username";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user.email) {
    return Response.json({ message: "Kindly log in to access this page!" });
  }

  const userID = session.user.id;

  if (userID) {
    const userDetails = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!userDetails) {
      return Response.json({ message: "User not found." }, { status: 404 });
    }

    if (!userDetails.username?.trim()) {
      const updated = await prisma.user.update({
        where: { id: userDetails.id },
        data: {
          username: defaultUsername({
            id: userDetails.id,
            email: userDetails.email,
            name: userDetails.name,
          }),
        },
      });
      return Response.json(updated);
    }

    return Response.json(userDetails);
  }

  return Response.json({ message: "Error while fetching user details." });
}
