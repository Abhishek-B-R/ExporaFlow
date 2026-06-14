"use client";

import IssueLabel from "@/components/workflow/issues/issue-label";
import IssuesTopTile from "@/components/workflow/issues/issues-top-tile";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { customToast } from "@/lib/custom-toast";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import { ticketMatchesSearch } from "@/lib/ticket-display";
import { TICKET_TYPE_OPTIONS } from "@/lib/ticket-type-labels";
import { IssueViewOptArray } from "@/utils/issues-view-options";
import { IssueBody } from "@/utils/types";
import { TicketType } from "@prisma/client";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AllIssue = IssueBody & {
  Project?: { id: string; title: string } | null;
};

type ProjectOption = {
  id: string;
  title: string;
};

export default function AllTicketsPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<AllIssue[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [ticketTypeFilter, setTicketTypeFilter] = useState<"" | TicketType>("");
  const [projectFilter, setProjectFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssueIndex, setSelectedIssueIndex] = useState(0);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await axios.get<ProjectOption[]>("/api/workflow/getprojects");
        const rows = Array.isArray(res.data) ? res.data : [];
        setProjects(
          rows
            .map((p) => ({ id: p.id, title: p.title }))
            .sort((a, b) => a.title.localeCompare(b.title)),
        );
      } catch {
        setProjects([]);
      }
    };
    void loadProjects();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (ticketTypeFilter) params.set("ticketType", ticketTypeFilter);
        if (projectFilter) params.set("projectId", projectFilter);
        const res = await axios.get<AllIssue[]>(
          `/api/issues/all${params.size ? `?${params.toString()}` : ""}`,
        );
        setIssues(res.data ?? []);
      } catch {
        customToast.error({ title: "", description: "Failed to load tickets." });
        setIssues([]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [statusFilter, ticketTypeFilter, projectFilter]);

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return issues;
    const lower = q.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.title.toLowerCase().includes(lower) ||
        (issue.Project?.title ?? "").toLowerCase().includes(lower) ||
        ticketMatchesSearch({
          query: q,
          issueId: issue.id,
          globalTicketNumber: issue.globalTicketNumber,
          ticketType: issue.ticketType,
          ticketNumber: issue.ticketNumber,
        }),
    );
  }, [issues, searchQuery]);

  useEffect(() => {
    setSelectedIssueIndex((prev) => {
      if (!filteredIssues.length) return 0;
      return Math.min(prev, filteredIssues.length - 1);
    });
  }, [filteredIssues.length, searchQuery, statusFilter, ticketTypeFilter, projectFilter]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!filteredIssues.length) return;
      const active =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const el = active ?? target;
      const inFormField = Boolean(
        el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT" ||
            el.isContentEditable ||
            el.closest("[contenteditable='true']")),
      );
      if (inFormField) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        setSelectedIssueIndex((prev) => Math.min(prev + 1, filteredIssues.length - 1));
      }
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSelectedIssueIndex((prev) => Math.max(prev - 1, 0));
      }
      if (event.key === "Enter") {
        const issue = filteredIssues[selectedIssueIndex];
        if (issue?.id && issue.Project?.id) {
          event.preventDefault();
          router.push(
            `/workflow/project/${issue.Project.id}/incident-tickets/${issue.id}`,
          );
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredIssues, router, selectedIssueIndex]);

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Issue} windowTitle="All tickets">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-(--border) px-4 py-3 bg-(--surface-2)">
          <h1 className="text-sm font-medium text-(--foreground)">All tickets</h1>
          <p className="text-xs text-(--muted-2) mt-0.5">
            Every ticket across projects you can access.
          </p>
        </div>

        <div className="border-b border-(--border) px-4 py-2 flex flex-wrap items-center gap-2 bg-(--surface-1)">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, project, or EXP-000001…"
            className="h-8 min-w-[200px] flex-1 max-w-md rounded-md border border-(--border) bg-(--surface-2) px-2.5 text-xs outline-none focus:border-sky-400/50"
          />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-8 max-w-[180px] rounded-md border border-(--border) bg-(--surface-2) px-2 text-xs outline-none truncate"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-(--border) bg-(--surface-2) px-2 text-xs outline-none"
          >
            <option value="">All statuses</option>
            {IssueViewOptArray.map((opt) => (
              <option key={opt.title} value={opt.title}>
                {opt.title}
              </option>
            ))}
          </select>
          <select
            value={ticketTypeFilter}
            onChange={(e) => setTicketTypeFilter(e.target.value as "" | TicketType)}
            className="h-8 rounded-md border border-(--border) bg-(--surface-2) px-2 text-xs outline-none"
          >
            <option value="">All types</option>
            {TICKET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {!isLoading ? (
            <span className="text-xs text-(--muted-2) tabular-nums ml-auto">
              {filteredIssues.length} ticket{filteredIssues.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        <IssuesTopTile />

        {isLoading ? (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pt-1 space-y-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-10 border-b border-(--border) flex items-center px-4 gap-4 animate-pulse"
              >
                <div className="w-4 h-4 rounded bg-(--surface-3) shrink-0" />
                <div className="h-3 bg-(--surface-3) rounded w-1/3" />
                <div className="h-3 bg-(--surface-3) rounded w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : filteredIssues.length > 0 ? (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pt-1">
            {filteredIssues.map((issue, index) => (
              <IssueLabel
                key={issue.id}
                title={issue.title}
                projectKey={issue.Project?.title}
                projectID={issue.Project?.id ?? issue.projectId}
                issueID={issue.id}
                status={issue.status}
                issueStatus={issue.status}
                priority={issue.priority}
                updatedAt={issue.updatedAt}
                assigneeInfo={issue.User}
                ticketType={issue.ticketType}
                ticketNumber={issue.ticketNumber}
                globalTicketNumber={issue.globalTicketNumber}
                dueDate={issue.dueDate}
                selected={index === selectedIssueIndex}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
            <SVGIcon className="w-8 h-8 text-(--muted-2) mb-3" svgString={RAW_ICONS.Issue} />
            <p className="text-sm text-(--muted-2)">No tickets match your filters.</p>
          </div>
        )}
      </div>
    </WorkflowLayout>
  );
}
