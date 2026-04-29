import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { runAI } from "@/lib/ai/providers";
import { cleanString, cleanStringArray, extractJsonObject } from "@/lib/ai/json";
import { checkAIRateLimit } from "@/lib/ai/rate-limit-guard";

type DraftPayload = {
  title: string;
  description: string;
  labels: string[];
  severityHint: string;
  acceptanceCriteria: string[];
  priority: string;
  status: string;
};

function fallbackDraft(text: string): DraftPayload {
  return {
    title: text.split("\n")[0]?.slice(0, 90) || "Untitled issue",
    description: text,
    labels: [],
    severityHint: "Medium",
    acceptanceCriteria: ["Issue is reproducible or clearly described", "Expected behavior is verified"],
    priority: "Medium",
    status: "Backlog",
  };
}

function normalizeDraft(raw: unknown, text: string): DraftPayload {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const fallback = fallbackDraft(text);
  return {
    title: cleanString(source.title, fallback.title).slice(0, 120),
    description: cleanString(source.description, fallback.description),
    labels: cleanStringArray(source.labels),
    severityHint: cleanString(source.severityHint, fallback.severityHint),
    acceptanceCriteria: cleanStringArray(source.acceptanceCriteria),
    priority: cleanString(source.priority, fallback.priority),
    status: cleanString(source.status, fallback.status),
  };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const rateLimited = await checkAIRateLimit(session.user.id);
  if (rateLimited) return rateLimited;

  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return Response.json({ message: "text is required." }, { status: 400 });
  }

  const prompt = `
Turn this rough issue idea into production-quality issue JSON.
Return one JSON object with exactly these keys:
title, description, labels, severityHint, acceptanceCriteria, priority, status.

Rules:
- title: crisp, action-oriented, max 90 chars.
- description: include context, expected behavior, actual behavior, and useful implementation notes when inferable.
- labels: 1-5 lowercase product/engineering labels.
- severityHint: Low, Medium, High, or Critical.
- priority: No Priority, Low, Medium, High, or Urgent.
- status: Backlog unless the text explicitly says it is already planned or in progress.
- acceptanceCriteria: 2-5 concrete checkable bullets.
- Return only valid JSON.

Input:
${text}
`;

  try {
    const completion = await runAI([
      { role: "system", content: "You are an issue drafting assistant." },
      { role: "user", content: prompt },
    ]);

    const parsed = extractJsonObject(completion, fallbackDraft(text));
    return Response.json({ draft: normalizeDraft(parsed, text) });
  } catch (error) {
    console.error("AI draft failed:", error);
    return Response.json(
      { message: "AI drafting failed.", draft: fallbackDraft(text) },
      { status: 200 },
    );
  }
}
