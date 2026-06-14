"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CommandItem = {
  id: string;
  label: string;
  section: string;
  hint?: string;
  run: () => void;
};

type SearchIssue = {
  id: string;
  title: string;
  status?: string | null;
  projectId: string;
  projectTitle?: string;
};

type SearchProject = {
  id: string;
  title: string;
  status?: string | null;
};

function formFieldHasFocus(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type?.toLowerCase() ?? "text";
    if (["checkbox", "radio", "button", "submit", "reset"].includes(type)) return false;
    return true;
  }
  if (el.isContentEditable) return true;
  if (el.closest("[contenteditable='true']")) return true;
  const role = el.getAttribute("role");
  return role === "textbox" || role === "searchbox";
}

export default function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{
    issues: SearchIssue[];
    projects: SearchProject[];
  }>({ issues: [], projects: [] });
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const routeMatch = pathname.match(/\/workflow\/project\/([^/]+)/);
    if (routeMatch?.[1]) {
      const routeProjectId = decodeURIComponent(routeMatch[1]);
      setProjectId(routeProjectId);
      localStorage.setItem("EXPORA_PROJECT_ID", routeProjectId);
      return;
    }
    setProjectId(localStorage.getItem("EXPORA_PROJECT_ID"));
  }, [pathname]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) {
      setSearchResults({ issues: [], projects: [] });
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSearching(true);
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as {
          issues?: SearchIssue[];
          projects?: SearchProject[];
        };
        setSearchResults({
          issues: data.issues ?? [],
          projects: data.projects ?? [],
        });
      } catch {
        if (!controller.signal.aborted) {
          setSearchResults({ issues: [], projects: [] });
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 160);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommand = event.metaKey || event.ctrlKey;
      if (isCommand && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") setOpen(false);
      if (isCommand && event.key.toLowerCase() === "i" && projectId && !formFieldHasFocus()) {
        event.preventDefault();
        router.push(`/workflow/project/${projectId}/incident-tickets`);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [projectId, router]);

  const baseCommands = useMemo<CommandItem[]>(() => {
    const currentProject = projectId;
    return [
      { id: "projects", label: "Go to Projects", section: "Navigate", hint: "G P", run: () => router.push("/workflow/project") },
      { id: "inbox", label: "Go to Inbox", section: "Navigate", hint: "G I", run: () => router.push("/workflow/inbox") },
      { id: "views", label: "Go to Views", section: "Navigate", hint: "G V", run: () => router.push("/workflow/views") },
      { id: "import", label: "Open Import", section: "Navigate", hint: "CSV/Jira", run: () => router.push("/workflow/import") },
      {
        id: "project-issues",
        label: "Open Current Project Issues",
        section: "Current project",
        hint: "Cmd/Ctrl + I",
        run: () => currentProject && router.push(`/workflow/project/${currentProject}/incident-tickets`),
      },
      {
        id: "project-board",
        label: "Open Current Project Board",
        section: "Current project",
        hint: "Board",
        run: () => currentProject && router.push(`/workflow/project/${currentProject}/board`),
      },
      {
        id: "project-sprints",
        label: "Open Current Project Sprints",
        section: "Current project",
        hint: "AI plan",
        run: () => currentProject && router.push(`/workflow/project/${currentProject}/sprints`),
      },
    ];
  }, [projectId, router]);

  const commandItems = useMemo<CommandItem[]>(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const filteredBase = baseCommands.filter((item) =>
      item.label.toLowerCase().includes(normalizedQuery),
    );

    const issueCommands = searchResults.issues.map((issue) => ({
      id: `issue-${issue.id}`,
      label: issue.title,
      section: "Issues",
      hint: `${issue.projectTitle ?? "Project"}${issue.status ? ` · ${issue.status}` : ""}`,
      run: () => router.push(`/workflow/project/${issue.projectId}/incident-tickets/${issue.id}`),
    }));

    const projectCommands = searchResults.projects.map((project) => ({
      id: `project-${project.id}`,
      label: project.title,
      section: "Projects",
      hint: project.status ?? "Open project",
      run: () => router.push(`/workflow/project/${project.id}/incident-tickets`),
    }));

    return [...filteredBase, ...issueCommands, ...projectCommands].slice(0, 12);
  }, [baseCommands, query, router, searchResults.issues, searchResults.projects]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, commandItems.length]);

  if (!open) return null;

  const runSelected = () => {
    const item = commandItems[selectedIndex];
    if (!item) return;
    item.run();
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      className="fixed inset-0 z-50 ef-modal-overlay flex items-start justify-center pt-20 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-(--border-strong) bg-(--surface-1) shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setSelectedIndex((prev) => Math.min(prev + 1, commandItems.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setSelectedIndex((prev) => Math.max(prev - 1, 0));
            }
            if (event.key === "Enter") {
              event.preventDefault();
              runSelected();
            }
          }}
          placeholder="Search commands, projects, and issues..."
          className="w-full h-12 px-4 bg-transparent border-b border-(--border) text-sm outline-none"
        />
        <div className="max-h-[420px] overflow-y-auto p-2">
          {commandItems.map((item, index) => {
            const previous = commandItems[index - 1];
            const showSection = !previous || previous.section !== item.section;
            return (
              <div key={item.id}>
                {showSection ? (
                  <p className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-wide text-(--muted-2)">
                    {item.section}
                  </p>
                ) : null}
                <button
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    item.run();
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                    selectedIndex === index ? "bg-(--surface-3)" : "hover:bg-(--surface-2)"
                  }`}
                >
                  <span className="text-sm truncate">{item.label}</span>
                  <span className="ml-3 shrink-0 text-xs text-(--muted-2)">{item.hint}</span>
                </button>
              </div>
            );
          })}
          {commandItems.length === 0 && (
            <p className="text-sm text-(--muted-2) px-3 py-3">
              {searching ? "Searching..." : "No command, project, or issue found."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
