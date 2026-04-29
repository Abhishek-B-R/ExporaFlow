import { prisma } from "@/db";

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/\b(ui|ux)\b/g, "frontend")
    .replace(/\bcrash(?:es|ing)?\b/g, "error")
    .replace(/\bfails?\b/g, "error")
    .replace(/\blog ?in\b/g, "signin")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string) {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "when",
  "from",
  "into",
  "issue",
  "bug",
  "task",
  "user",
]);

function tokenOverlapScore(a: string, b: string) {
  const aSet = new Set(tokens(a));
  const bSet = new Set(tokens(b));
  if (!aSet.size || !bSet.size) return 0;
  let common = 0;
  for (const token of aSet) if (bSet.has(token)) common += 1;
  return (2 * common) / (aSet.size + bSet.size);
}

function titleScore(a: string, b: string) {
  const exactish =
    normalize(a) === normalize(b) ||
    normalize(a).includes(normalize(b)) ||
    normalize(b).includes(normalize(a));
  return exactish ? 1 : tokenOverlapScore(a, b);
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
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const ranked = issues
    .map((issue) => {
      const hay = `${issue.title} ${issue.description ?? ""}`.trim();
      const lexical = tokenOverlapScore(needle, hay);
      const titleSimilarity = titleScore(title, issue.title);
      const activeBoost =
        issue.status && !["Completed", "Cancelled"].includes(issue.status) ? 0.05 : 0;
      const score = Math.min(1, lexical * 0.55 + titleSimilarity * 0.4 + activeBoost);
      return { ...issue, score: Number(score.toFixed(2)) };
    })
    .filter((issue) => issue.score >= 0.28)
    .sort((a, b) => b.score - a.score)
    .slice(0, take);

  return ranked;
}
