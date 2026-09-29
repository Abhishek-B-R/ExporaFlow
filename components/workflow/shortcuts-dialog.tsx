"use client";

import { useEffect } from "react";
import { GOTO_TARGETS } from "@/lib/hooks/use-global-shortcuts";

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-(--border) bg-(--surface-2) px-1.5 py-0.5 font-mono text-[11px] text-(--muted)">
      {children}
    </kbd>
  );
}

function Row({ keys, label }: { keys: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-(--foreground)">{label}</span>
      <span className="flex shrink-0 items-center gap-1">{keys}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-(--muted-2)">
        {title}
      </p>
      <div className="divide-y divide-(--border)">{children}</div>
    </div>
  );
}

/**
 * The `?` cheatsheet. Linear's equivalent is how anyone discovers the
 * shortcuts exist at all, so the list here is generated from the same
 * GOTO_TARGETS the handler uses — it cannot drift out of sync.
 */
export default function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border border-(--border) bg-(--surface-1) p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-(--foreground)">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="rounded-md px-2 py-1 text-xs text-(--muted-2) hover:bg-(--surface-3) hover:text-(--foreground) focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            Esc
          </button>
        </div>

        <div className="space-y-4">
          <Section title="General">
            <Row keys={<><Key>⌘</Key><Key>K</Key></>} label="Command palette" />
            <Row keys={<Key>c</Key>} label="New ticket" />
            <Row keys={<Key>/</Key>} label="Focus search" />
            <Row keys={<Key>?</Key>} label="This dialog" />
          </Section>

          <Section title="Go to">
            {Object.entries(GOTO_TARGETS).map(([key, target]) => (
              <Row
                key={key}
                keys={<><Key>g</Key><span className="text-[11px] text-(--muted-2)">then</span><Key>{key}</Key></>}
                label={target.label}
              />
            ))}
          </Section>

          <Section title="Ticket list">
            <Row keys={<><Key>j</Key><Key>k</Key></>} label="Move down / up" />
            <Row keys={<Key>↵</Key>} label="Open selected ticket" />
            <Row keys={<Key>x</Key>} label="Select ticket" />
            <Row keys={<><Key>⇧</Key><Key>click</Key></>} label="Select a range" />
          </Section>
        </div>
      </div>
    </div>
  );
}
