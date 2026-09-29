"use client";

import { useState } from "react";
import axios from "axios";
import { customToast } from "@/lib/custom-toast";

type Member = { id: string; name?: string | null; email?: string | null };

type BulkActionBarProps = {
  selectedIds: string[];
  statusOptions: string[];
  priorityOptions: string[];
  members: Member[];
  canChangeStatus: boolean;
  canChangePriority: boolean;
  canAssign: boolean;
  onClear: () => void;
  onDone: () => void | Promise<void>;
};

/**
 * Appears when rows are selected, like Jira's bulk-change bar.
 *
 * Updates go through the existing per-ticket PATCH rather than a new bulk
 * endpoint: that route already owns permission checks, SLA recalculation,
 * activity logging and mention emails, and duplicating all of that server-side
 * is how the two paths drift apart. Requests are issued in small batches so a
 * 50-ticket change does not open 50 sockets at once.
 */
export default function BulkActionBar({
  selectedIds,
  statusOptions,
  priorityOptions,
  members,
  canChangeStatus,
  canChangePriority,
  canAssign,
  onClear,
  onDone,
}: BulkActionBarProps) {
  const [busy, setBusy] = useState(false);

  const applyToAll = async (patch: Record<string, unknown>, label: string) => {
    if (selectedIds.length === 0) return;
    setBusy(true);

    const BATCH = 5;
    let failed = 0;

    try {
      for (let i = 0; i < selectedIds.length; i += BATCH) {
        const batch = selectedIds.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map((issueId) =>
            axios.patch("/api/issues/updateissue", { issueId, ...patch }),
          ),
        );
        failed += results.filter((r) => r.status === "rejected").length;
      }

      const ok = selectedIds.length - failed;
      if (failed === 0) {
        customToast.success({
          title: "",
          description: `${label} on ${ok} ticket${ok === 1 ? "" : "s"}.`,
        });
      } else {
        // Partial success is the normal failure mode here — say so precisely
        // rather than claiming the whole batch worked or failed.
        customToast.warning({
          title: "",
          description: `${label} on ${ok} of ${selectedIds.length}; ${failed} failed.`,
        });
      }
      await onDone();
    } finally {
      setBusy(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="sticky bottom-0 z-30 mx-2 mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-(--border-strong) bg-(--surface-1) px-3 py-2 shadow-lg"
    >
      <span className="text-xs font-medium text-(--foreground) tabular-nums">
        {selectedIds.length} selected
      </span>

      {canChangeStatus ? (
        <select
          aria-label="Set status for selected tickets"
          disabled={busy}
          value=""
          onChange={(event) => {
            const value = event.target.value;
            if (value) void applyToAll({ issueStatus: value }, `Status set to ${value}`);
            event.target.value = "";
          }}
          className="h-7 rounded-md border border-(--border) bg-(--surface-2) px-2 text-xs outline-none disabled:opacity-50"
        >
          <option value="">Status…</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}

      {canChangePriority ? (
        <select
          aria-label="Set priority for selected tickets"
          disabled={busy}
          value=""
          onChange={(event) => {
            const value = event.target.value;
            if (value) void applyToAll({ issuePriority: value }, `Priority set to ${value}`);
            event.target.value = "";
          }}
          className="h-7 rounded-md border border-(--border) bg-(--surface-2) px-2 text-xs outline-none disabled:opacity-50"
        >
          <option value="">Priority…</option>
          {priorityOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}

      {canAssign ? (
        <select
          aria-label="Assign selected tickets"
          disabled={busy}
          value=""
          onChange={(event) => {
            const value = event.target.value;
            if (!value) return;
            const member = members.find((m) => m.id === value);
            void applyToAll(
              { assignedUser: value, assigneeIds: [value] },
              `Assigned to ${member?.name ?? member?.email ?? "member"}`,
            );
            event.target.value = "";
          }}
          className="h-7 rounded-md border border-(--border) bg-(--surface-2) px-2 text-xs outline-none disabled:opacity-50"
        >
          <option value="">Assign…</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name || member.email || member.id}
            </option>
          ))}
        </select>
      ) : null}

      {busy ? <span className="text-xs text-(--muted-2)">Applying…</span> : null}

      <button
        type="button"
        onClick={onClear}
        disabled={busy}
        className="ml-auto rounded-md px-2 py-1 text-xs text-(--muted-2) hover:bg-(--surface-3) hover:text-(--foreground) disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        Clear
      </button>
    </div>
  );
}
