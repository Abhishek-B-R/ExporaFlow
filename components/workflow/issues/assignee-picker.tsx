"use client";

import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type AssigneeOption = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type AssigneePickerProps = {
  options: AssigneeOption[];
  /** Ordered ids; index 0 is the primary/accountable owner. */
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

function displayName(option: AssigneeOption) {
  return option.name || option.email || "Team member";
}

function Avatar({ option, size = 24 }: { option: AssigneeOption; size?: number }) {
  const label = displayName(option);
  if (option.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={option.image}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="rounded-full bg-sky-100 text-sky-700 font-semibold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Multi-assignee picker.
 *
 * The first id in `value` is the primary owner (mirrored to Issue.assignedUser
 * server-side), so selection order matters and the list is not sorted.
 */
export function AssigneePicker({
  options,
  value,
  onChange,
  disabled = false,
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const byId = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  const selected = useMemo(
    () => value.map((id) => byId.get(id)).filter((o): o is AssigneeOption => Boolean(o)),
    [value, byId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) =>
        displayName(option).toLowerCase().includes(q) ||
        (option.email ?? "").toLowerCase().includes(q),
    );
  }, [options, search]);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  };

  /** Promote someone already on the ticket to primary owner. */
  const makeOwner = (id: string) => {
    onChange([id, ...value.filter((v) => v !== id)]);
  };

  const triggerLabel =
    selected.length === 0
      ? "Unassigned"
      : selected.length === 1
        ? displayName(selected[0])
        : `${displayName(selected[0])} +${selected.length - 1}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={
            selected.length === 0
              ? "Assignees: unassigned"
              : `Assignees: ${selected.map(displayName).join(", ")}`
          }
          className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none disabled:opacity-70 flex items-center gap-2 text-left focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          {selected.length > 0 ? (
            <span className="flex -space-x-1.5 shrink-0">
              {selected.slice(0, 3).map((option) => (
                <Avatar key={option.id} option={option} size={20} />
              ))}
            </span>
          ) : null}
          <span className="truncate flex-1">{triggerLabel}</span>
          <span aria-hidden="true" className="text-(--muted-2) shrink-0">
            ▾
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(18rem,calc(100vw-2rem))] p-0 overflow-hidden"
      >
        <div className="p-2 border-b border-(--border)">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people…"
            aria-label="Search people"
            className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          />
        </div>

        <div role="listbox" aria-multiselectable="true" className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-xs text-(--muted-2)">No people found.</p>
          ) : (
            filtered.map((option) => {
              const isSelected = value.includes(option.id);
              const isOwner = value[0] === option.id;
              return (
                <div
                  key={option.id}
                  className="flex items-center gap-2 px-2 hover:bg-(--surface-3)"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(option.id)}
                    className="flex flex-1 items-center gap-2 py-2 text-left text-sm min-w-0 focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center text-[10px] ${
                        isSelected
                          ? "bg-sky-600 border-sky-600 text-white"
                          : "border-(--border-strong)"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    <Avatar option={option} size={24} />
                    <span className="truncate">{displayName(option)}</span>
                  </button>

                  {isOwner ? (
                    <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-900">
                      Owner
                    </span>
                  ) : isSelected ? (
                    <button
                      type="button"
                      onClick={() => makeOwner(option.id)}
                      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-(--muted-2) hover:text-sky-700 hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-500"
                      title={`Make ${displayName(option)} the owner`}
                    >
                      Make owner
                    </button>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {value.length > 0 ? (
          <div className="border-t border-(--border) p-2">
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full rounded-md px-2 py-1.5 text-xs text-(--muted-2) hover:bg-(--surface-3) hover:text-(--foreground) focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
