import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { runAI } from "@/lib/ai/providers";
import { cleanString, extractJsonObject } from "@/lib/ai/json";
import { checkAIRateLimit } from "@/lib/ai/rate-limit-guard";

type TriagePayload = {
  priority: string;
  severity: string;
  routingTeamHint: string;
  effortHint: string;
  risk: string;
  rationale: string;
};

const fallbackTriage: TriagePayload = {
  priority: "Medium",
  severity: "Medium",
  routingTeamHint: "Engineering",
  effortHint: "M",
  risk: "Needs human review before assignment.",
  rationale: "Fallback heuristic suggestion.",
};

function normalizeTriage(raw: unknown): TriagePayload {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    priority: cleanString(source.priority, fallbackTriage.priority),
    severity: cleanString(source.severity, fallbackTriage.severity),
    routingTeamHint: cleanString(source.routingTeamHint, fallbackTriage.routingTeamHint),
    effortHint: cleanString(source.effortHint, fallbackTriage.effortHint),
    risk: cleanString(source.risk, fallbackTriage.risk),
    rationale: cleanString(source.rationale, fallbackTriage.rationale),
  };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const rateLimited = await checkAIRateLimit(session.user.id);
  if (rateLimited) return rateLimited;

  const { title, description, labels } = await request.json();
  if (!title || typeof title !== "string") {
    return Response.json({ message: "title is required." }, { status: 400 });
  }

  const prompt = `
Provide triage suggestions in one JSON object with:
priority, severity, routingTeamHint, effortHint, risk, rationale.

Rules:
- priority: No Priority, Low, Medium, High, or Urgent.
- severity: Low, Medium, High, or Critical.
- effortHint: XS, S, M, L, or XL.
- Suggestions only; do not claim anything was changed.
Issue:
title: ${title}
description: ${description ?? ""}
labels: ${Array.isArray(labels) ? labels.join(", ") : ""}
Return only valid JSON.
`;
  try {
    const completion = await runAI([
      { role: "system", content: "You suggest issue triage values without auto-taking actions." },
      { role: "user", content: prompt },
    ]);
    return Response.json({
      suggestions: normalizeTriage(extractJsonObject(completion, fallbackTriage)),
    });
  } catch (error) {
    console.error("AI triage failed:", error);
    return Response.json({ suggestions: fallbackTriage });
  }
}
