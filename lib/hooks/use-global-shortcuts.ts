"use client";

import { useEffect, useRef } from "react";

/**
 * Global keyboard shortcuts, Linear-style.
 *
 * Two kinds of binding:
 *  - single keys ("c", "/", "?")
 *  - "go to" sequences ("g" then "d"), which is how Linear does navigation
 *
 * Everything is suppressed while the user is typing, and while a modifier is
 * held, so these never fight with the browser or the command palette.
 */

export type ShortcutHandlers = {
  onCreate?: () => void;
  onFocusSearch?: () => void;
  onShowHelp?: () => void;
  onNavigate?: (path: string) => void;
};

/** The "g <key>" navigation targets. Exported so the help dialog can list them. */
export const GOTO_TARGETS: Record<string, { path: string; label: string }> = {
  d: { path: "/workflow/dashboard", label: "Dashboard" },
  i: { path: "/workflow/inbox", label: "Inbox" },
  m: { path: "/workflow/my-issues", label: "My tickets" },
  p: { path: "/workflow/project", label: "Projects" },
  t: { path: "/workflow/tickets", label: "All tickets" },
  c: { path: "/workflow/store/customers", label: "Customers" },
};

/** True when focus is somewhere the user expects plain typing to insert text. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type?.toLowerCase() ?? "text";
    return !["checkbox", "radio", "button", "submit", "reset"].includes(type);
  }
  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable='true']")) return true;
  const role = target.getAttribute("role");
  return role === "textbox" || role === "searchbox";
}

export function useGlobalShortcuts(handlers: ShortcutHandlers) {
  // Keep the latest handlers without re-binding the listener every render.
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    // Set when "g" is pressed; the next keypress completes the sequence.
    let gotoArmed = false;
    let gotoTimer: ReturnType<typeof setTimeout> | undefined;

    const disarm = () => {
      gotoArmed = false;
      if (gotoTimer) clearTimeout(gotoTimer);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Let the command palette own ⌘K, and never hijack browser shortcuts.
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (gotoArmed) {
        const target = GOTO_TARGETS[key];
        disarm();
        if (target) {
          event.preventDefault();
          ref.current.onNavigate?.(target.path);
        }
        return;
      }

      switch (key) {
        case "g":
          gotoArmed = true;
          // Linear drops the sequence if you hesitate; so do we.
          gotoTimer = setTimeout(disarm, 1500);
          break;
        case "c":
          event.preventDefault();
          ref.current.onCreate?.();
          break;
        case "/":
          event.preventDefault();
          ref.current.onFocusSearch?.();
          break;
        case "?":
          event.preventDefault();
          ref.current.onShowHelp?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      disarm();
    };
  }, []);
}
