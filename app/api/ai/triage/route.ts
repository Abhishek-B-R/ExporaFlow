import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { runAI } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ message: "Log in first!" }, { status: 401 });
  }

  const { title, description, labels } = await request.json();
  if (!title || typeof title !== "string") {
    return Response.json({ message: "title is required." }, { status: 400 });
  }

  const prompt = `
Provide triage suggestions in JSON:
priority, severity, routingTeamHint, rationale.
Issue:
title: ${title}
description: ${description ?? ""}
labels: ${Array.isArray(labels) ? labels.join(", ") : ""}
Return only JSON.
`;
  try {
    const completion = await runAI([
      { role: "system", content: "You suggest issue triage values without auto-taking actions." },
      { role: "user", content: prompt },
    ]);
    return Response.json({ suggestions: JSON.parse(completion) });
  } catch (error) {
    console.error("AI triage failed:", error);
    return Response.json({
      suggestions: {
        priority: "Medium",
        severity: "Medium",
        routingTeamHint: "Engineering",
        rationale: "Fallback heuristic suggestion.",
      },
    });
  }
}
