import { NextRequest, NextResponse } from "next/server";
import { acceptInvitationByMagicToken } from "@/lib/invite-accept";
import { createDatabaseSession } from "@/lib/auth-session";

function appOrigin(request: NextRequest) {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    request.nextUrl.origin
  );
}

function welcomeUrl(
  origin: string,
  result: Extract<Awaited<ReturnType<typeof acceptInvitationByMagicToken>>, { ok: true }>,
) {
  const params = new URLSearchParams({
    workspace: result.workspaceName,
    role: result.role,
    new: result.alreadyMember ? "0" : "1",
  });
  return `${origin}/invite/welcome?${params.toString()}`;
}

function errorRedirect(origin: string, message: string, token?: string | null) {
  const params = new URLSearchParams({ error: message });
  if (token) params.set("token", token);
  return `${origin}/invite/join?${params.toString()}`;
}

async function completeJoin(token: string) {
  const result = await acceptInvitationByMagicToken(token);
  if (!result.ok) {
    return { ok: false as const, result };
  }
  await createDatabaseSession(result.user.id);
  return { ok: true as const, result };
}

/** One-click magic invite from email (GET). */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const origin = appOrigin(request);

  if (!token) {
    return NextResponse.redirect(errorRedirect(origin, "Missing invitation token."));
  }

  const joined = await completeJoin(token);
  if (!joined.ok) {
    return NextResponse.redirect(
      errorRedirect(origin, joined.result.message, token),
    );
  }

  return NextResponse.redirect(welcomeUrl(origin, joined.result));
}

/** Polished join flow from the invite page (POST + staged UI). */
export async function POST(request: NextRequest) {
  const origin = appOrigin(request);
  let token: string | null = null;

  try {
    const body = await request.json();
    token = typeof body?.token === "string" ? body.token : null;
  } catch {
    token = null;
  }

  if (!token) {
    return Response.json({ message: "Missing invitation token." }, { status: 400 });
  }

  const joined = await completeJoin(token);
  if (!joined.ok) {
    return Response.json(
      { message: joined.result.message },
      { status: joined.result.status },
    );
  }

  return Response.json({
    workspaceName: joined.result.workspaceName,
    role: joined.result.role,
    alreadyMember: joined.result.alreadyMember,
    redirectUrl: welcomeUrl(origin, joined.result),
  });
}
