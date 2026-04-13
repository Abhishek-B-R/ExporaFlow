import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { runAI } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return Response.json({ message: "text is required." }, { status: 400 });
  }

  const prompt = `
Turn this rough issue idea into JSON with:
title, description, labels (string[]), severityHint, acceptanceCriteria (string[]).
Return only valid JSON.
Input:
${text}
`;

  try {
    const completion = await runAI([
      { role: "system", content: "You are an issue drafting assistant." },
      { role: "user", content: prompt },
    ]);

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(completion);
    } catch {
      parsed = {
        title: text.slice(0, 80),
        description: text,
        labels: [],
        severityHint: "Medium",
        acceptanceCriteria: [],
      };
    }

    return Response.json({ draft: parsed });
  } catch (error) {
    console.error("AI draft failed:", error);
    const fallbackDraft = {
      title: text.slice(0, 80),
      description: text,
      labels: [],
      severityHint: "Medium",
      acceptanceCriteria: [],
    };
    return Response.json(
      { message: "AI drafting failed.", draft: fallbackDraft },
      { status: 200 },
    );
  }
}
