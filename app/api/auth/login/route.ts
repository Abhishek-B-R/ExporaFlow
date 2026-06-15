import { NextRequest } from "next/server";
import { createDatabaseSession } from "@/lib/auth-session";
import { loginBodySchema } from "@/lib/custom-auth-schemas";
import { loginWithPassword } from "@/lib/custom-auth";

export async function POST(request: NextRequest) {
  const parsed = loginBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid request.";
    return Response.json({ message }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const result = await loginWithPassword({ email, password });

  if (!result.ok) {
    return Response.json({ message: result.message }, { status: result.status });
  }

  await createDatabaseSession(result.userId);

  return Response.json({
    message: "Signed in.",
    redirectUrl: result.redirectUrl,
  });
}
