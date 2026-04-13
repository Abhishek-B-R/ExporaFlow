import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const title = payload?.object_attributes?.title ?? payload?.commits?.[0]?.message ?? "GitLab update";
  const refs = JSON.stringify(payload).match(/[A-Z]+-\d+/g) ?? [];

  return Response.json({
    message: "GitLab webhook received.",
    detectedIssueRefs: Array.from(new Set(refs)),
    linkedCount: Array.from(new Set(refs)).length,
    title,
  });
}
