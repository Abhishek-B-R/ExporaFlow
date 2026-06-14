"use client";

import { useMemo, useState } from "react";

export type EmployeeOption = {
  id: string;
  fullName: string;
  email: string;
  userId?: string | null;
  assignableUserId?: string | null;
  isActive?: boolean;
};

function resolveAssignableId(employee: EmployeeOption): string | null {
  return employee.assignableUserId ?? employee.userId ?? null;
}

type EmployeeMultiPickerProps = {
  employees: EmployeeOption[];
  value: string[];
  onChange: (userIds: string[]) => void;
  onReload?: () => void | Promise<void>;
};

export function EmployeeMultiPicker({
  employees,
  value,
  onChange,
  onReload,
}: EmployeeMultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.isActive !== false),
    [employees],
  );

  const assignable = useMemo(
    () =>
      activeEmployees.filter((e) => Boolean(resolveAssignableId(e))),
    [activeEmployees],
  );

  const unlinked = useMemo(
    () =>
      activeEmployees.filter((e) => !resolveAssignableId(e)),
    [activeEmployees],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assignable;
    return assignable.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q),
    );
  }, [assignable, search]);

  const filteredUnlinked = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unlinked;
    return unlinked.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q),
    );
  }, [unlinked, search]);

  const selectedEmployees = useMemo(
    () =>
      assignable.filter((e) => {
        const id = resolveAssignableId(e);
        return id && value.includes(id);
      }),
    [assignable, value],
  );

  const toggle = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  const emptyMessage = (() => {
    if (activeEmployees.length === 0) {
      return "No employees in the directory yet. Add people under Store → Employees.";
    }
    if (assignable.length === 0) {
      return "Employees need a matching login email before they can be assigned to projects.";
    }
    if (search.trim()) {
      return "No assignable employees match your search.";
    }
    return "No assignable employees found.";
  })();

  return (
    <div className="min-w-0 space-y-2">
      {!open ? (
        <div className="rounded-lg border border-(--border-strong) bg-(--surface-2) px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-(--muted-2) mb-1">
                Assigned employees
              </p>
              {selectedEmployees.length === 0 ? (
                <p className="text-sm text-(--muted-2)">
                  No employees assigned yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedEmployees.map((e) => (
                    <span
                      key={e.id}
                      className="inline-flex items-center gap-1 rounded-md border border-(--border) bg-(--surface-1) px-2 py-0.5 text-xs font-medium text-(--foreground)"
                    >
                      {e.fullName}
                      <button
                        type="button"
                        onClick={() => {
                          const id = resolveAssignableId(e);
                          if (id) toggle(id);
                        }}
                        className="text-(--muted-2) hover:text-(--foreground)"
                        aria-label={`Remove ${e.fullName}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="ef-btn-primary h-8 px-3 rounded-md text-xs font-medium shrink-0"
            >
              {selectedEmployees.length > 0 ? "Edit" : "Assign"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-(--border-strong) bg-(--surface-1) overflow-hidden shadow-sm">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-(--border) bg-(--surface-2)">
            <p className="text-xs font-semibold text-(--foreground)">
              Select employees
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearch("");
              }}
              className="text-xs text-(--muted-2) hover:text-(--foreground) font-medium"
            >
              Done
            </button>
          </div>
          <div className="p-3 space-y-2">
            <input
              className="ef-field text-sm px-3 py-2 w-full"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {onReload ? (
              <button
                type="button"
                onClick={() => void onReload()}
                className="ef-btn-outline h-8 px-3 rounded-md text-xs font-medium"
              >
                Refresh list
              </button>
            ) : null}
          </div>
          <div className="max-h-48 overflow-y-auto border-t border-(--border)">
            {filtered.length === 0 && filteredUnlinked.length === 0 ? (
              <p className="px-3 py-4 text-sm text-(--muted-2) text-center">
                {emptyMessage}
              </p>
            ) : (
              <>
                {filtered.slice(0, 80).map((e) => {
                  const uid = resolveAssignableId(e)!;
                  const checked = value.includes(uid);
                  return (
                    <label
                      key={e.id}
                      className={`flex items-center gap-3 px-3 py-2 border-b border-(--border)/60 last:border-0 cursor-pointer ${
                        checked ? "bg-sky-50" : "hover:bg-(--surface-2)"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(uid)}
                        className="rounded border-(--border-strong)"
                      />
                      <div className="min-w-0 text-sm">
                        <span className="font-medium text-(--foreground)">
                          {e.fullName}
                        </span>
                        <span className="text-(--muted-2)"> · {e.email}</span>
                      </div>
                    </label>
                  );
                })}
                {filteredUnlinked.slice(0, 20).map((e) => (
                  <div
                    key={`unlinked-${e.id}`}
                    className="flex items-center gap-3 px-3 py-2 border-b border-(--border)/60 bg-zinc-50/80 opacity-80"
                  >
                    <input
                      type="checkbox"
                      disabled
                      className="rounded border-(--border-strong)"
                    />
                    <div className="min-w-0 text-sm">
                      <span className="font-medium text-(--foreground)">
                        {e.fullName}
                      </span>
                      <span className="text-(--muted-2)"> · {e.email}</span>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        No login for this email — use the same email as their
                        ExporaFlow account, or invite them first.
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
