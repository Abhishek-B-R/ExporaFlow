export const ISSUE_STATUSES = [
  "Backlog",
  "Planned",
  "Working",
  "Completed",
  "Cancelled",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

const TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Backlog: ["Planned", "Working", "Cancelled"],
  Planned: ["Working", "Backlog", "Cancelled"],
  Working: ["Completed", "Cancelled", "Backlog"],
  Completed: ["Working", "Backlog"],
  Cancelled: ["Backlog", "Planned"],
};

export function isValidIssueStatus(value: unknown): value is IssueStatus {
  return typeof value === "string" && (ISSUE_STATUSES as readonly string[]).includes(value);
}

export function canTransitionIssueStatus(params: {
  from: string | null | undefined;
  to: string | null | undefined;
}): boolean {
  const { from, to } = params;
  if (!isValidIssueStatus(from) || !isValidIssueStatus(to)) return false;
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

