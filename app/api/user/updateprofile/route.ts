import { NextRequest } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { defaultUsername } from "@/lib/default-username";

export async function PATCH(request: NextRequest) {
  const { username, fullname } = await request.json();

  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return new Response(JSON.stringify({ message: "Kindly log in!" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, username: true },
    });
    if (!existing) {
      return new Response(JSON.stringify({ message: "User not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const nextUsername =
      typeof username === "string" && username.trim()
        ? username.trim()
        : defaultUsername({
            id: existing.id,
            email: existing.email,
            name: typeof fullname === "string" ? fullname : existing.name,
          });

    const updatedProfile = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: typeof fullname === "string" ? fullname : existing.name,
        username: nextUsername,
      },
    });

    if (updatedProfile) {
      return new Response(JSON.stringify({ message: "User info updated!" }));
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ message: "Error updating user info!" })
    );
  }
}
