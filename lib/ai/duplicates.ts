import { prisma } from "@/db";

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlapScore(a: string, b: string) {
  const aSet = new Set(normalize(a).split(" ").filter(Boolean));
  const bSet = new Set(normalize(b).split(" ").filter(Boolean));
  if (!aSet.size || !bSet.size) return 0;
  let common = 0;
  for (const token of aSet) if (bSet.has(token)) common += 1;
  return common / Math.max(aSet.size, bSet.size);
}

export async function findDuplicateIssueCandidates(params: {
  projectId: string;
  title: string;
  description?: string;
  take?: number;
}) {
  const { projectId, title, description, take = 5 } = params;
  const needle = `${title} ${description ?? ""}`.trim();

  const issues = await prisma.issue.findMany({
    where: { projectId },
    select: { id: true, title: true, description: true, status: true, priority: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const ranked = issues
    .map((issue) => {
      const hay = `${issue.title} ${issue.description ?? ""}`.trim();
      const score = tokenOverlapScore(needle, hay);
      return { ...issue, score };
    })
    .filter((issue) => issue.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, take);

  return ranked;
}
