"use client";

import { customToast } from "@/lib/custom-toast";
import { IssueBody, ProjectBody, SprintBody } from "@/utils/types";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import { ProjectNavbar } from "@/components/workflow/project-navbar";
import { EnterpriseDatePicker } from "@/components/workflow/enterprise-date-picker";

function daysBetween(start: Date, end: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / oneDay));
}

function fmtDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type SprintPlanning = {
  effortEstimateByIssue?: Record<string, number>;
  recommendedScope?: string[];
  riskFlags?: string[];
  summary?: string;
};

const STATUS_COLORS: Record<string, string> = {
  Backlog: "text-[#a4a6aa]",
  Planned: "text-sky-600",
  Working: "text-[#e5a63b]",
  Completed: "text-[#30b27a]",
  Cancelled: "text-[#e05f5f]",
};

const SPRINT_STATUS_BADGE: Record<string, string> = {
  Planned: "border-sky-200 bg-sky-50 text-sky-600",
  Active: "border-[#30b27a]/30 bg-[#30b27a]/10 text-[#30b27a]",
  Closed: "border-[#a4a6aa]/30 bg-[#a4a6aa]/10 text-[#a4a6aa]",
};

export default function SprintsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const [issues, setIssues] = useState<IssueBody[]>([]);
  const [sprints, setSprints] = useState<SprintBody[]>([]);
  const [project, setProject] = useState<ProjectBody | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [planning, setPlanning] = useState<SprintPlanning | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [aiSprintName, setAiSprintName] = useState("");



  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const [issuesRes, sprintsRes] = await Promise.all([
        axios.post("/api/issues/getissues", { project_id: projectId }),
        axios.post("/api/sprints/getsprints", { projectId }),
      ]);
      setIssues(issuesRes.data ?? []);
      setSprints(sprintsRes.data ?? []);
    } catch {
      customToast.error({ title: "", description: "Failed to load sprint data." });
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!projectId) return;
    const fetchProject = async () => {
      try {
        const res = await axios.post("/api/workflow/project", { project_id: projectId });
        setProject(res.data ?? null);
      } catch {
        setProject(null);
      }
    };
    fetchProject();
  }, [projectId]);

  const createSprint = async () => {
    if (!projectId || !name.trim()) return;
    try {
      await axios.post("/api/sprints/createsprint", {
        projectId,
        name: name.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setName("");
      setStartDate("");
      setEndDate("");
      setShowCreateSprint(false);
      customToast.success({ title: "", description: "Sprint created." });
      await refresh();
    } catch {
      customToast.error({ title: "", description: "Failed to create sprint." });
    }
  };

  const setSprintStatus = async (sprintId: string, status: "Active" | "Closed") => {
    try {
      await axios.patch("/api/sprints/updatesprint", { sprintId, status });
      customToast.success({ title: "", description: `Sprint marked ${status}.` });
      await refresh();
    } catch {
      customToast.error({ title: "", description: "Failed to update sprint." });
    }
  };

  const assignIssue = async (issueId: string, sprintId: string | null) => {
    try {
      await axios.patch("/api/sprints/assignissue", { issueId, sprintId });
      await refresh();
    } catch {
      customToast.error({ title: "", description: "Failed to move issue." });
    }
  };

  const runAiSprintPlan = async () => {
    if (!projectId) return;
    try {
      setIsPlanning(true);
      const res = await axios.post("/api/ai/sprint-plan", { projectId });
      setPlanning(res.data?.planning ?? null);
      setAiSprintName(`AI Sprint ${fmtDate(new Date())}`);
    } catch {
      customToast.error({ title: "", description: "AI sprint planning failed." });
    } finally {
      setIsPlanning(false);
    }
  };

  const acceptAiPlan = async () => {
    if (!projectId || !planning) return;
    const sprintName = aiSprintName.trim() || `AI Sprint ${fmtDate(new Date())}`;
    try {
      setIsAccepting(true);
      // 1. Create the sprint
      const sprintRes = await axios.post("/api/sprints/createsprint", {
        projectId,
        name: sprintName,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
      });
      const newSprintId = sprintRes.data?.id;
      if (!newSprintId) throw new Error("Sprint creation returned no ID");

      // 2. Assign recommended issues to the sprint
      const scopeIds = planning.recommendedScope ?? issues.slice(0, 8).map((i) => i.id);
      for (const issueId of scopeIds) {
        try {
          await axios.patch("/api/sprints/assignissue", { issueId, sprintId: newSprintId });
        } catch {
          // skip issues that fail (e.g. wrong project)
        }
      }

      customToast.success({
        title: "Sprint created",
        description: `"${sprintName}" created with ${scopeIds.length} issues.`,
      });
      setPlanning(null);
      await refresh();
    } catch {
      customToast.error({ title: "", description: "Failed to create sprint from AI plan." });
    } finally {
      setIsAccepting(false);
    }
  };

  const timelineData = useMemo(() => {
    type TimelineRow = SprintBody & { offsetDays: number; widthDays: number };
    const dated = sprints.filter((s) => s.startDate && s.endDate);
    if (dated.length === 0) {
      return { min: null as Date | null, totalDays: 1, rows: [] as TimelineRow[] };
    }
    const starts = dated.map((s) => new Date(s.startDate as string));
    const ends = dated.map((s) => new Date(s.endDate as string));
    const min = new Date(Math.min(...starts.map((d) => d.getTime())));
    const max = new Date(Math.max(...ends.map((d) => d.getTime())));
    const totalDays = daysBetween(min, max) + 1;
    const rows: TimelineRow[] = dated.map((s) => {
      const sDate = new Date(s.startDate as string);
      const eDate = new Date(s.endDate as string);
      const offsetDays = daysBetween(min, sDate) - 1;
      const widthDays = daysBetween(sDate, eDate);
      return { ...s, offsetDays, widthDays };
    });
    return { min, totalDays, rows };
  }, [sprints]);

  const backlogIssues = issues.filter((i) => !i.sprintId);
  const sprintIssueMap = sprints.reduce<Record<string, IssueBody[]>>((acc, sprint) => {
    acc[sprint.id] = issues.filter((i) => i.sprintId === sprint.id);
    return acc;
  }, {});

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Issue} windowTitle="Issues">
      <ProjectNavbar projectId={projectId} projectTitle={project?.title} />

      {/* Main content */}
      <div className="grow overflow-y-auto px-4 md:px-6 py-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-medium">Sprints</p>
            <p className="text-sm text-(--muted-2)">
              {sprints.length} sprint{sprints.length !== 1 ? "s" : ""} · {issues.length} issue{issues.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateSprint(!showCreateSprint)}
              className="h-8 px-3 rounded-md border border-(--border-strong) bg-(--surface-2) text-sm hover:bg-(--surface-3) transition-colors"
            >
              + New sprint
            </button>
            <button
              onClick={runAiSprintPlan}
              disabled={isPlanning || issues.length === 0}
              className="h-8 px-3 rounded-md border border-[#0ea5e9]/30 bg-[#0ea5e9]/10 text-[#0ea5e9] text-sm hover:bg-[#0ea5e9]/20 transition-colors disabled:opacity-50"
            >
              {isPlanning ? "Planning…" : "✨ AI Sprint Plan"}
            </button>
          </div>
        </div>

        {/* Create sprint form (collapsible) */}
        {showCreateSprint && (
          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4">
            <p className="text-sm font-medium mb-3">Create sprint</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sprint name"
                className="h-9 rounded-md border border-(--border) bg-(--surface-2) px-3 text-sm"
              />
              <EnterpriseDatePicker
                label="Start date"
                value={startDate}
                onChange={setStartDate}
              />
              <EnterpriseDatePicker
                label="End date"
                value={endDate}
                onChange={setEndDate}
              />
              <div className="flex items-end">
              <button
                onClick={createSprint}
                disabled={!name.trim()}
                className="h-9 w-full rounded-md border border-(--border-strong) bg-(--surface-3) text-sm disabled:opacity-50 hover:bg-(--surface-4) transition-colors"
              >
                Create
              </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Sprint Planning Panel */}
        {planning && (
          <div className="rounded-xl border border-[#0ea5e9]/20 bg-[#0ea5e9]/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#0ea5e9]">AI Sprint Planning Recommendation</p>
                <p className="text-xs text-(--muted-2)">
                  {(planning.recommendedScope ?? []).length || issues.length} issues scoped · Review before committing
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={acceptAiPlan}
                  disabled={isAccepting}
                  className="text-xs px-3 py-1.5 rounded-md bg-[#0ea5e9] text-white hover:bg-sky-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {isAccepting ? "Creating…" : "✓ Accept & Create Sprint"}
                </button>
                <button
                  onClick={() => setPlanning(null)}
                  className="text-xs text-(--muted-2) hover:text-white px-2 py-1.5 rounded border border-(--border) hover:bg-(--surface-3)"
                >
                  Dismiss
                </button>
              </div>
            </div>
            {planning.summary && <p className="text-sm text-(--muted)">{planning.summary}</p>}
            <div className="flex items-center gap-2 mt-1">
              <label className="text-xs text-(--muted-2)">Sprint name:</label>
              <input
                value={aiSprintName}
                onChange={(e) => setAiSprintName(e.target.value)}
                className="h-7 rounded border border-(--border) bg-(--surface-2) px-2 text-xs flex-1 max-w-xs"
                placeholder="Sprint name"
              />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="rounded-lg border border-(--border) bg-(--surface-1) p-3">
                <p className="text-xs text-(--muted-2) mb-2 uppercase tracking-wide">Recommended Scope</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {(planning.recommendedScope ?? issues.slice(0, 8).map((i) => i.id)).map((issueId) => {
                    const issue = issues.find((item) => item.id === issueId);
                    if (!issue) return null;
                    return (
                      <div key={issue.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-(--surface-2) text-sm">
                        <span className="truncate">{issue.title}</span>
                        <span className="shrink-0 text-xs text-(--muted-2)">
                          {planning.effortEstimateByIssue?.[issue.id] ?? 3} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-lg border border-(--border) bg-(--surface-1) p-3">
                <p className="text-xs text-(--muted-2) mb-2 uppercase tracking-wide">Risk Flags</p>
                <div className="space-y-1">
                  {(planning.riskFlags ?? []).map((risk, idx) => (
                    <p key={idx} className="text-sm text-(--muted) px-2 py-1.5 rounded bg-(--surface-2)">{risk}</p>
                  ))}
                  {(!planning.riskFlags || planning.riskFlags.length === 0) && (
                    <p className="text-sm text-(--muted-2)">No major risks identified.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sprint Sections — compact table-style */}
        {sprints.map((sprint) => {
          const sprintIssues = sprintIssueMap[sprint.id] ?? [];
          const isCollapsed = collapsedSections.has(sprint.id);
          const badgeClass = SPRINT_STATUS_BADGE[sprint.status] ?? SPRINT_STATUS_BADGE.Planned;

          return (
            <div key={sprint.id} className="rounded-xl border border-(--border) bg-(--surface-1) overflow-hidden">
              {/* Sprint header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-(--surface-2) transition-colors"
                onClick={() => toggleSection(sprint.id)}
              >
                <div className="flex items-center gap-3">
                  <SVGIcon
                    className={`flex w-4 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
                    svgString={RAW_ICONS.ArrowDown}
                  />
                  <p className="text-sm font-medium">{sprint.name}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {sprint.status}
                  </span>
                  <span className="text-xs text-(--muted-2)">
                    {sprintIssues.length} issue{sprintIssues.length !== 1 ? "s" : ""}
                  </span>
                  {sprint.startDate && sprint.endDate && (
                    <span className="text-xs text-(--muted-2) hidden md:inline">
                      {fmtDate(sprint.startDate)} — {fmtDate(sprint.endDate)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {sprint.status !== "Active" && (
                    <button
                      onClick={() => setSprintStatus(sprint.id, "Active")}
                      className="text-xs h-7 px-2 rounded border border-(--border) hover:bg-(--surface-3) transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {sprint.status !== "Closed" && (
                    <button
                      onClick={() => setSprintStatus(sprint.id, "Closed")}
                      className="text-xs h-7 px-2 rounded border border-(--border) hover:bg-(--surface-3) transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Sprint issues table */}
              {!isCollapsed && (
                <div className="border-t border-(--border)">
                  {sprintIssues.length === 0 ? (
                    <p className="text-sm text-(--muted-2) px-4 py-3">No issues in this sprint.</p>
                  ) : (
                    <div className="divide-y divide-(--border)">
                      {sprintIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-(--surface-2) transition-colors group"
                        >
                          <span className={`text-xs w-20 shrink-0 ${STATUS_COLORS[issue.status ?? "Backlog"] ?? "text-(--muted-2)"}`}>
                            {issue.status ?? "Backlog"}
                          </span>
                          <Link
                            href={`/workflow/project/${projectId}/incident-tickets/${issue.id}`}
                            className="text-sm truncate flex-1 hover:text-sky-600 transition-colors"
                          >
                            {issue.title}
                          </Link>
                          <span className="text-xs text-(--muted-2) w-20 shrink-0 text-right">
                            {issue.priority ?? "—"}
                          </span>
                          <select
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs rounded border border-(--border) bg-(--surface-2) px-1 w-28 shrink-0"
                            onChange={(e) => {
                              if (e.target.value === "__backlog__") {
                                assignIssue(issue.id, null);
                              } else if (e.target.value) {
                                assignIssue(issue.id, e.target.value);
                              }
                              e.target.value = "";
                            }}
                            defaultValue=""
                          >
                            <option value="">Move to…</option>
                            <option value="__backlog__">Backlog</option>
                            {sprints
                              .filter((s) => s.id !== sprint.id)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Backlog Section */}
        <div className="rounded-xl border border-(--border) bg-(--surface-1) overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-(--surface-2) transition-colors"
            onClick={() => toggleSection("__backlog__")}
          >
            <div className="flex items-center gap-3">
              <SVGIcon
                className={`flex w-4 transition-transform duration-200 ${collapsedSections.has("__backlog__") ? "-rotate-90" : "rotate-0"}`}
                svgString={RAW_ICONS.ArrowDown}
              />
              <p className="text-sm font-medium">Backlog</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-(--border) text-(--muted-2)">
                Unassigned
              </span>
              <span className="text-xs text-(--muted-2)">
                {backlogIssues.length} issue{backlogIssues.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {!collapsedSections.has("__backlog__") && (
            <div className="border-t border-(--border)">
              {backlogIssues.length === 0 ? (
                <p className="text-sm text-(--muted-2) px-4 py-3">No backlog issues.</p>
              ) : (
                <div className="divide-y divide-(--border)">
                  {backlogIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-(--surface-2) transition-colors group"
                    >
                      <span className={`text-xs w-20 shrink-0 ${STATUS_COLORS[issue.status ?? "Backlog"] ?? "text-(--muted-2)"}`}>
                        {issue.status ?? "Backlog"}
                      </span>
                      <Link
                        href={`/workflow/project/${projectId}/incident-tickets/${issue.id}`}
                        className="text-sm truncate flex-1 hover:text-sky-600 transition-colors"
                      >
                        {issue.title}
                      </Link>
                      <span className="text-xs text-(--muted-2) w-20 shrink-0 text-right">
                        {issue.priority ?? "—"}
                      </span>
                      <select
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs rounded border border-(--border) bg-(--surface-2) px-1 w-28 shrink-0"
                        onChange={(e) => {
                          if (e.target.value) {
                            assignIssue(issue.id, e.target.value);
                          }
                          e.target.value = "";
                        }}
                        defaultValue=""
                      >
                        <option value="">Move to…</option>
                        {sprints.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline view */}
        {timelineData.rows.length > 0 && (
          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4">
            <p className="text-sm font-medium mb-3">Timeline</p>
            <div className="space-y-2">
              {timelineData.rows.map((row) => {
                const left = (row.offsetDays / timelineData.totalDays) * 100;
                const width = (row.widthDays / timelineData.totalDays) * 100;
                const badgeClass = SPRINT_STATUS_BADGE[row.status] ?? SPRINT_STATUS_BADGE.Planned;
                return (
                  <div key={row.id} className="grid grid-cols-[160px_1fr] gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <p className="text-sm truncate">{row.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${badgeClass}`}>
                        {row.status}
                      </span>
                    </div>
                    <div className="h-7 rounded bg-(--surface-2) relative overflow-hidden border border-(--border)">
                      <div
                        className="absolute top-1 bottom-1 rounded bg-sky-100 border border-sky-300"
                        style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isLoading && sprints.length === 0 && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl border border-(--border) bg-(--surface-1) overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-4 h-4 rounded bg-(--surface-3)" />
                  <div className="h-3.5 bg-(--surface-3) rounded w-40" />
                  <div className="h-3.5 bg-(--surface-3) rounded w-16" />
                </div>
                <div className="border-t border-(--border) divide-y divide-(--border)">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                      <div className="h-3 bg-(--surface-3) rounded w-16" />
                      <div className="h-3 bg-(--surface-3) rounded flex-1" />
                      <div className="h-3 bg-(--surface-3) rounded w-14" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkflowLayout>
  );
}
