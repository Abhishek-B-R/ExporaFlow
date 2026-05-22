"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type CustomerOption = {
  id: string;
  name: string;
  organizationName: string;
};

type CustomerPickerProps = {
  customers: CustomerOption[];
  value: string | null;
  onChange: (customerId: string | null) => void;
  onReload?: () => void | Promise<void>;
};

export function CustomerPicker({
  customers,
  value,
  onChange,
  onReload,
}: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => customers.find((c) => c.id === value) ?? null,
    [customers, value],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.organizationName.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="min-w-0 space-y-2">
      {!open ? (
        <div className="rounded-lg border border-(--border-strong) bg-(--surface-2) px-3 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-(--muted-2)">
              Selected
            </p>
            {selected ? (
              <p className="text-sm font-medium text-(--foreground) truncate">
                {selected.organizationName}
                <span className="text-(--muted-2) font-normal"> · {selected.name}</span>
              </p>
            ) : (
              <p className="text-sm text-(--muted-2)">No customer linked to this project</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {selected ? (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="ef-btn-outline h-8 px-3 rounded-md text-xs font-medium"
              >
                Remove
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="ef-btn-primary h-8 px-3 rounded-md text-xs font-medium"
            >
              {selected ? "Change" : "Select customer"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-(--border-strong) bg-(--surface-1) overflow-hidden shadow-sm">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-(--border) bg-(--surface-2)">
            <p className="text-xs font-semibold text-(--foreground)">Choose a customer</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearch("");
              }}
              className="text-xs text-(--muted-2) hover:text-(--foreground) font-medium"
            >
              Cancel
            </button>
          </div>

          <div className="p-3 space-y-2">
            <input
              className="ef-field text-sm px-3 py-2 w-full"
              placeholder="Search by organization or contact name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => pick(null)}
                className="ef-btn-outline h-8 px-3 rounded-md font-medium"
              >
                No customer
              </button>
              <div className="flex gap-2">
                {onReload ? (
                  <button
                    type="button"
                    onClick={() => void onReload()}
                    className="ef-btn-outline h-8 px-3 rounded-md font-medium"
                  >
                    Refresh list
                  </button>
                ) : null}
                <Link
                  href="/workflow/store/customers"
                  target="_blank"
                  className="ef-btn-outline h-8 px-3 rounded-md font-medium inline-flex items-center"
                >
                  + Add in Store
                </Link>
              </div>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto border-t border-(--border)">
            <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-(--muted-2) bg-(--surface-2) border-b border-(--border) sticky top-0">
              <span>Organization · Contact</span>
              <span className="text-right pr-1">Action</span>
            </div>
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-(--muted-2) text-center">
                No customers match your search.
              </p>
            ) : (
              filtered.slice(0, 50).map((c) => {
                const isSelected = value === c.id;
                return (
                  <div
                    key={c.id}
                    className={`grid grid-cols-[1fr_auto] gap-2 items-center px-3 py-2 border-b border-(--border)/60 last:border-0 ${
                      isSelected ? "bg-sky-50" : "hover:bg-(--surface-2)"
                    }`}
                  >
                    <div className="min-w-0 text-sm">
                      <span className="font-medium text-(--foreground)">
                        {c.organizationName}
                      </span>
                      <span className="text-(--muted-2)"> · {c.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => pick(c.id)}
                      className={
                        isSelected
                          ? "h-8 px-3 rounded-md text-xs font-medium bg-sky-100 text-sky-800 border border-sky-300"
                          : "ef-btn-primary h-8 px-3 rounded-md text-xs font-medium min-w-[4.5rem]"
                      }
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
