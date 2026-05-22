export type MentionSuggestion = {
  id: string;
  label: string;
  handle: string;
  email?: string | null;
  image?: string | null;
};

export function mentionHandleFromUser(input: {
  name?: string | null;
  email?: string | null;
  username?: string | null;
  id: string;
}): string {
  if (input.username?.trim()) return input.username.trim().toLowerCase();
  if (input.email?.includes("@")) {
    return input.email.split("@")[0]!.toLowerCase();
  }
  if (input.name?.trim()) {
    return input.name.trim().toLowerCase().replace(/\s+/g, "");
  }
  return input.id.slice(0, 8).toLowerCase();
}

/** Text before cursor ends with `@` + optional query (no spaces). */
export function getActiveMentionQuery(
  text: string,
  cursor: number,
): { query: string; start: number; end: number } | null {
  const before = text.slice(0, cursor);
  const match = before.match(/@([a-zA-Z0-9._-]*)$/);
  if (!match || match.index === undefined) return null;
  return {
    query: match[1] ?? "",
    start: match.index,
    end: cursor,
  };
}

export function filterMentionSuggestions(
  candidates: MentionSuggestion[],
  query: string,
): MentionSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return candidates;

  return candidates.filter((c) => {
    const handle = c.handle.toLowerCase();
    const label = c.label.toLowerCase();
    const firstName = label.split(/\s+/)[0] ?? "";
    const emailLocal = c.email?.split("@")[0]?.toLowerCase() ?? "";
    return (
      handle.startsWith(q) ||
      label.startsWith(q) ||
      firstName.startsWith(q) ||
      emailLocal.startsWith(q)
    );
  });
}

export function insertMentionAt(
  text: string,
  start: number,
  end: number,
  handle: string,
): { value: string; cursor: number } {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const insertion = `@${handle} `;
  const value = `${before}${insertion}${after}`;
  return { value, cursor: before.length + insertion.length };
}
