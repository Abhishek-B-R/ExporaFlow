/** Derive a readable default handle when the user has not set one. */
export function defaultUsername(user: {
  email?: string | null;
  name?: string | null;
  id: string;
}): string {
  const fromEmail = user.email?.split("@")[0]?.trim();
  if (fromEmail) {
    const cleaned = fromEmail.toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (cleaned.length >= 2) return cleaned;
  }

  const fromName = user.name
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (fromName && fromName.length >= 2) return fromName.slice(0, 24);

  return `user-${user.id.slice(0, 8).toLowerCase()}`;
}

export function resolveUsername(user: {
  username?: string | null;
  email?: string | null;
  name?: string | null;
  id: string;
}): string {
  const stored = user.username?.trim();
  if (stored) return stored;
  return defaultUsername(user);
}
