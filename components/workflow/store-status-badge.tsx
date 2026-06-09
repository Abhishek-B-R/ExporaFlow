"use client";

export function StoreStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        isActive
          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
          : "bg-zinc-100 text-zinc-600 border border-zinc-300"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
