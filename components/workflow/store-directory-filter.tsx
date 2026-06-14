"use client";

export type StoreDirectoryFilter = "active" | "inactive" | "all";

type Props = {
  value: StoreDirectoryFilter;
  onChange: (value: StoreDirectoryFilter) => void;
};

const OPTIONS: { value: StoreDirectoryFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

export function StoreDirectoryFilterBar({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-(--muted-2)">Show:</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`h-8 px-3 rounded-md border text-xs font-medium transition-colors ${
            value === opt.value
              ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-(--foreground)"
              : "border-(--border) bg-(--surface-1) text-(--muted) hover:bg-(--surface-2)"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
