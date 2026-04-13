import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const title = payload?.pull_request?.title ?? payload?.head_commit?.message ?? "GitHub update";
  const refs = JSON.stringify(payload).match(/[A-Z]+-\d+/g) ?? [];

  return Response.json({
    message: "GitHub webhook received.",
    detectedIssueRefs: Array.from(new Set(refs)),
    linkedCount: Array.from(new Set(refs)).length,
    title,
  });
}
