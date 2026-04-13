"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

export default function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const updateProjectId = () => {
      const routeMatch = pathname.match(/\/workflow\/project\/([^/]+)/);
      if (routeMatch?.[1]) {
        const routeProjectId = decodeURIComponent(routeMatch[1]);
        setProjectId(routeProjectId);
        localStorage.setItem("EXPORA_PROJECT_ID", routeProjectId);
        return;
      }
      const raw = localStorage.getItem("EXPORA_PROJECT_ID");
      setProjectId(raw);
    };

    updateProjectId();
    const onStorage = () => updateProjectId();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommand = event.metaKey || event.ctrlKey;
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (isCommand && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
      if (isCommand && event.key.toLowerCase() === "i" && projectId && !isTyping) {
        event.preventDefault();
        router.push(`/workflow/project/${projectId}/issues`);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [projectId, router]);

  const commands = useMemo<CommandItem[]>(() => {
    const currentProject = projectId;
    return [
      { id: "projects", label: "Go to Projects", hint: "G P", run: () => router.push("/workflow/project") },
      { id: "inbox", label: "Go to Inbox", hint: "G I", run: () => router.push("/workflow/inbox") },
      { id: "views", label: "Go to Views", hint: "G V", run: () => router.push("/workflow/views") },
      {
        id: "project-issues",
        label: "Open Current Project Issues",
        hint: "Cmd/Ctrl + I",
        run: () => {
          if (currentProject) router.push(`/workflow/project/${currentProject}/issues`);
        },
      },
      {
        id: "new-issue",
        label: "Create Issue",
        hint: "Quick create",
        run: () => {
          if (currentProject) router.push(`/workflow/project/${currentProject}/issues`);
        },
      },
    ];
  }, [projectId, router]);

  const filtered = commands.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase().trim()),
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl linear-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search commands..."
          className="w-full h-11 px-3 bg-transparent border-b border-(--border)"
        />
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.run();
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-(--surface-3) flex items-center justify-between"
            >
              <span className="text-sm">{item.label}</span>
              <span className="text-xs text-(--muted-2)">{item.hint}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-(--muted-2) px-3 py-2">No command found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
