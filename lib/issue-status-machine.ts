export const ISSUE_STATUSES = [
  "Backlog",
  "Planned",
  "Working",
  "Completed",
  "Cancelled",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export function isValidIssueStatus(value: unknown): value is IssueStatus {
  return typeof value === "string" && (ISSUE_STATUSES as readonly string[]).includes(value);
}

export function canTransitionIssueStatus(params: {
  from: string | null | undefined;
  to: string | null | undefined;
}): boolean {
  const { from, to } = params;
  if (typeof from === "undefined" || from === null || from === "") {
    return isValidIssueStatus(to);
  }
  return isValidIssueStatus(from) && isValidIssueStatus(to);
}
