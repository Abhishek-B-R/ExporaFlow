"use client";

import { ReactNode, useEffect } from "react";

type WorkflowModalProps = {
  children: ReactNode;
  onClose?: () => void;
  /** Tailwind max-width utility, e.g. max-w-2xl */
  maxWidth?: string;
  panelClassName?: string;
};

/**
 * Centered workflow dialog — fixed to viewport, no horizontal page scroll.
 */
export function WorkflowModal({
  children,
  onClose,
  maxWidth = "max-w-2xl",
  panelClassName = "",
}: WorkflowModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden ef-modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("[data-radix-popper-content-wrapper]")) return;
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`relative flex flex-col w-full min-w-0 ${maxWidth} max-h-[min(90dvh,720px)] overflow-hidden rounded-xl border border-(--border-strong) bg-(--surface-1) shadow-2xl text-(--foreground) ${panelClassName}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function WorkflowModalHeader({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-3 border-b border-(--border) px-4 py-3 md:px-5">
      <div className="min-w-0 flex-1">{children}</div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1.5 rounded-md text-(--muted) hover:text-(--foreground) hover:bg-(--surface-3) transition-colors"
          aria-label="Close"
        >
          <span className="text-lg leading-none" aria-hidden>
            ×
          </span>
        </button>
      ) : null}
    </div>
  );
}

export function WorkflowModalBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-4 py-4 md:px-5 space-y-4">
      {children}
    </div>
  );
}

export function WorkflowModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 flex items-center justify-end gap-3 border-t border-(--border) px-4 py-3 md:px-5 bg-(--surface-2)/50">
      {children}
    </div>
  );
}
