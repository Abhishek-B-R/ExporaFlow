import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function nextAuthSessionCookieName() {
  const secure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  return secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

export async function createDatabaseSession(userId: string) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const { prisma } = await import("@/db");
  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(nextAuthSessionCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires,
  });

  return { sessionToken, expires };
}
