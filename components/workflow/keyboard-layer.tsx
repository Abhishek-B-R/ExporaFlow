"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalShortcuts } from "@/lib/hooks/use-global-shortcuts";
import ShortcutsDialog from "@/components/workflow/shortcuts-dialog";

/**
 * Mounts the app-wide shortcuts once, next to the command palette.
 *
 * `c` and `/` are handled generically rather than per-page: they look for the
 * page's own "new ticket" control and search box in the DOM. That keeps every
 * screen working without each one having to opt in, and silently does nothing
 * on screens that have neither.
 */
export default function KeyboardLayer() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  const onNavigate = useCallback(
    (path: string) => {
      setHelpOpen(false);
      router.push(path);
    },
    [router],
  );

  const onCreate = useCallback(() => {
    const trigger = document.querySelector<HTMLElement>("[data-shortcut='new-ticket']");
    trigger?.click();
  }, []);

  const onFocusSearch = useCallback(() => {
    const field =
      document.querySelector<HTMLElement>("[data-shortcut='search']") ??
      document.querySelector<HTMLElement>("input[type='search']");
    field?.focus();
    if (field instanceof HTMLInputElement) field.select();
  }, []);

  const onShowHelp = useCallback(() => setHelpOpen((open) => !open), []);

  useGlobalShortcuts({ onCreate, onFocusSearch, onShowHelp, onNavigate });

  return <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />;
}
