"use client";

import { roleBadgeClass, roleDisplayName } from "@/lib/role-display";
import { Role } from "@prisma/client";

export function RoleBadge({
  role,
  loading,
}: {
  role: Role | null | undefined;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex h-6 items-center rounded-md border border-(--border) bg-(--surface-2) px-2 text-[11px] text-(--muted-2)">
        Loading role…
      </span>
    );
  }
  if (!role) return null;
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-medium ${roleBadgeClass(role)}`}
      title={`Your role: ${roleDisplayName(role)}`}
    >
      {roleDisplayName(role)}
    </span>
  );
}
