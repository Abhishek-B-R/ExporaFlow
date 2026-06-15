import { NextRequest } from "next/server";
import { createDatabaseSession } from "@/lib/auth-session";
import { registerBodySchema } from "@/lib/custom-auth-schemas";
import { registerWithPassword } from "@/lib/custom-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const parsed = registerBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Invalid request.";
      return Response.json({ message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const result = await registerWithPassword({ name, email, password });

    if (!result.ok) {
      return Response.json({ message: result.message }, { status: result.status });
    }

    await createDatabaseSession(result.userId);

    return Response.json({
      message: "Account created.",
      redirectUrl: result.redirectUrl,
    });
  } catch (error) {
    console.error("[auth/register]", error);
    return Response.json(
      { message: "Sign-up failed on the server. Refresh the page and try again." },
      { status: 500 },
    );
  }
}
