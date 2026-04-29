"use client";

import { customToast } from "@/lib/custom-toast";
import { IssueBody, ProjectBody, SprintBody } from "@/utils/types";
import axios from "axios";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";

function daysBetween(start: Date, end: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / oneDay));
}

type SprintDragPayload = {
  issueId: string;
};

type SprintPlanning = {
  effortEstimateByIssue?: Record<string, number>;
  recommendedScope?: string[];
  riskFlags?: string[];
  summary?: string;
};

export default function SprintsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const path = usePathname();

  const [issues, setIssues] = useState<IssueBody[]>([]);
  const [sprints, setSprints] = useState<SprintBody[]>([]);
  const [project, setProject] = useState<ProjectBody | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [planning, setPlanning] = useState<SprintPlanning | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const activeTab =
    "flex h-7 items-center gap-x-1 cursor-pointer border border-[#3a3a3a] px-2 rounded bg-[#0A0A0A] hover:bg-[#151515] transition-all duration-300";
  const inactiveTab =
    "flex h-7 items-center gap-x-1 cursor-pointer border border-[#2b2b2b] px-2 rounded bg-[#0A0A0A] hover:bg-[#131313] transition-all duration-300";

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
    } catch {
      customToast.error({ title: "", description: "AI sprint planning failed." });
    } finally {
      setIsPlanning(false);
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
      <div className="border h-10 rounded border-[#2d3036] flex items-center justify-between px-4">
        <div className=" flex gap-x-2 items-center ">
          <Link
            href={"/workflow/project"}
            className="flex items-center rounded text-[12px] sm:text-[13px] md:text-[15px] border border-transparent hover:border-[#2E3035] px-2 h-7 hover:bg-[#1C1D21] transition-all duration-300"
          >
            Projects
          </Link>
          <div className="flex h-7 items-center gap-x-1 cursor-pointer border border-[#2E3035] px-2 rounded hover:bg-[#1C1D21] transition-all duration-300">
            <SVGIcon className="flex w-4" svgString={RAW_ICONS.Cube} />
            <p className="text-[12px] sm:text-[13px] md:text-[15px]">
              {project ? project.title : "Loading…"}
            </p>
          </div>
          <Link
            href={`/workflow/project/${projectId}`}
            className={path.includes("/issues") ? inactiveTab : activeTab}
          >
            <SVGIcon className="flex w-4" svgString={RAW_ICONS.Docs} />
            <p className="text-[12px] sm:text-[13px] md:text-[15px]">Overview</p>
          </Link>
          <Link
            href={`/workflow/project/${projectId}/issues`}
            className={path.includes("/issues") ? activeTab : inactiveTab}
          >
            <SVGIcon className="flex w-4" svgString={RAW_ICONS.Issue} />
            <p className="text-[12px] sm:text-[13px] md:text-[15px]">Issues</p>
          </Link>
          <Link
            href={`/workflow/project/${projectId}/sprints`}
            className={path.includes("/sprints") ? activeTab : inactiveTab}
          >
            <SVGIcon className="flex w-4" svgString={RAW_ICONS.PlannedIssue} />
            <p className="text-[12px] sm:text-[13px] md:text-[15px]">Sprints</p>
          </Link>
          <Link
            href={`/workflow/project/${projectId}/backlog`}
            className={path.includes("/backlog") ? activeTab : inactiveTab}
          >
            <SVGIcon className="flex w-4" svgString={RAW_ICONS.DashedCircle} />
            <p className="text-[12px] sm:text-[13px] md:text-[15px]">Backlog</p>
          </Link>
          <Link
            href={`/workflow/project/${projectId}/board`}
            className={path.includes("/board") ? activeTab : inactiveTab}
          >
            <SVGIcon className="flex w-4" svgString={RAW_ICONS.Stack} />
            <p className="text-[12px] sm:text-[13px] md:text-[15px]">Board</p>
          </Link>
        </div>
      </div>

      <div className="grow min-h-screen px-4 md:px-8 py-5 space-y-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-medium">Sprints</p>
              <p className="text-sm text-(--muted-2)">
                Create, start, close sprints and move issues between backlog and sprint.
              </p>
            </div>
            <button
              onClick={runAiSprintPlan}
              disabled={isPlanning || issues.length === 0}
              className="h-9 px-3 rounded-md border border-(--border-strong) bg-(--surface-3) text-sm disabled:opacity-50"
            >
              {isPlanning ? "Planning..." : "AI sprint plan"}
            </button>
          </div>
        </div>

        {planning ? (
          <div className="rounded-xl border border-(--border-strong) bg-(--surface-1) p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">AI sprint planning recommendation</p>
                <p className="text-xs text-(--muted-2)">
                  Suggested scope, effort, and risks for the current project backlog.
                </p>
              </div>
              <span className="rounded border border-(--border) bg-(--surface-2) px-2 py-1 text-xs">
                {(planning.recommendedScope ?? []).length || issues.length} issues scoped
              </span>
            </div>
            {planning.summary ? (
              <p className="text-sm text-(--muted-2)">{planning.summary}</p>
            ) : null}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="rounded-lg border border-(--border) bg-(--surface-2) p-3">
                <p className="text-xs text-(--muted-2) mb-2">Recommended scope</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(planning.recommendedScope ?? issues.slice(0, 8).map((issue) => issue.id)).map((issueId) => {
                    const issue = issues.find((item) => item.id === issueId);
                    if (!issue) return null;
                    return (
                      <div key={issue.id} className="rounded border border-(--border) bg-(--surface-1) px-2 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm truncate">{issue.title}</p>
                          <span className="text-xs text-(--muted-2)">
                            {planning.effortEstimateByIssue?.[issue.id] ?? 3} pts
                          </span>
                        </div>
                        <p className="text-xs text-(--muted-2)">{issue.status ?? "Backlog"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-lg border border-(--border) bg-(--surface-2) p-3">
                <p className="text-xs text-(--muted-2) mb-2">Risk flags</p>
                <div className="space-y-2">
                  {(planning.riskFlags ?? []).map((risk) => (
                    <p key={risk} className="rounded border border-(--border) bg-(--surface-1) px-2 py-2 text-sm">
                      {risk}
                    </p>
                  ))}
                  {(!planning.riskFlags || planning.riskFlags.length === 0) && (
                    <p className="text-sm text-(--muted-2)">No major risks identified.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A] p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sprint name"
          className="h-9 rounded-md border border-[#2f2f2f] bg-[#0F0F0F] px-2"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-9 rounded-md border border-[#2f2f2f] bg-[#0F0F0F] px-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-9 rounded-md border border-[#2f2f2f] bg-[#0F0F0F] px-2"
        />
        <button
          onClick={createSprint}
          className="h-9 rounded-md border border-[#3a3a3a] bg-[#141414]"
        >
          Create sprint
        </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A] p-4">
          <p className="text-sm font-medium mb-2">Sprint list</p>
          <div className="space-y-2">
            {sprints.map((s) => (
              <div key={s.id} className="rounded-md border border-[#2f2f2f] bg-[#0F0F0F] p-3">
                <div className="flex items-center justify-between">
                  <p>{s.name}</p>
                  <span className="text-xs text-(--muted-2)">{s.status}</span>
                </div>
                <p className="text-xs text-(--muted-2) mt-1">
                  {s.startDate ? new Date(s.startDate).toLocaleDateString() : "No start"} -{" "}
                  {s.endDate ? new Date(s.endDate).toLocaleDateString() : "No end"}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSprintStatus(s.id, "Active")}
                    className="text-xs h-7 px-2 rounded border border-(--border)"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => setSprintStatus(s.id, "Closed")}
                    className="text-xs h-7 px-2 rounded border border-(--border)"
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
            {sprints.length === 0 && (
              <p className="text-sm text-(--muted-2)">No sprints created yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A] p-4">
          <p className="text-sm font-medium mb-3">
            Drag and drop: Backlog ↔ Sprint lanes
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <SprintLane
              title="Backlog"
              issueCount={backlogIssues.length}
              onDropIssue={(payload) => assignIssue(payload.issueId, null)}
            >
              {backlogIssues.map((issue) => (
                <SprintIssueCard key={issue.id} issue={issue} />
              ))}
            </SprintLane>

            {sprints.map((sprint) => (
              <SprintLane
                key={sprint.id}
                title={`${sprint.name} (${sprint.status})`}
                issueCount={sprintIssueMap[sprint.id]?.length ?? 0}
                onDropIssue={(payload) => assignIssue(payload.issueId, sprint.id)}
              >
                {(sprintIssueMap[sprint.id] ?? []).map((issue) => (
                  <SprintIssueCard key={issue.id} issue={issue} />
                ))}
              </SprintLane>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A] p-4">
          <p className="text-sm font-medium mb-2">Backlog to sprint assignment</p>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {backlogIssues.map((issue) => (
              <div key={issue.id} className="rounded-md border border-[#2f2f2f] bg-[#0F0F0F] p-2">
                <p className="text-sm">{issue.title}</p>
                <select
                  className="mt-2 h-8 text-xs rounded border border-[#2f2f2f] bg-[#0A0A0A] px-2 w-full"
                  onChange={(e) => assignIssue(issue.id, e.target.value || null)}
                  defaultValue=""
                >
                  <option value="">Move to sprint...</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {backlogIssues.length === 0 && (
              <p className="text-sm text-(--muted-2)">No backlog issues right now.</p>
            )}
          </div>
        </div>
        </div>

        <div className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A] p-4">
        <p className="text-sm font-medium mb-3">Timeline view (date-range bars)</p>
        {timelineData.rows.length === 0 ? (
          <p className="text-sm text-(--muted-2)">
            Add start/end dates to sprints to see timeline bars.
          </p>
        ) : (
          <div className="space-y-2">
            {timelineData.rows.map((row) => {
              const left = (row.offsetDays / timelineData.totalDays) * 100;
              const width = (row.widthDays / timelineData.totalDays) * 100;
              return (
                <div key={row.id} className="grid grid-cols-[200px_1fr] gap-3 items-center">
                  <p className="text-sm truncate">{row.name}</p>
                  <div className="h-7 rounded bg-[#0F0F0F] relative overflow-hidden border border-[#2f2f2f]">
                    <div
                      className="absolute top-1 bottom-1 rounded bg-[#2a2a2a]"
                      style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>

        {isLoading && <p className="text-sm text-(--muted-2)">Refreshing...</p>}
      </div>
    </WorkflowLayout>
  );
}

function SprintLane({
  title,
  issueCount,
  children,
  onDropIssue,
}: {
  title: string;
  issueCount: number;
  children: React.ReactNode;
  onDropIssue: (payload: SprintDragPayload) => void;
}) {
  return (
    <div
      className="rounded-lg border border-[#2f2f2f] bg-[#0F0F0F] min-h-40"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        try {
          const payload = JSON.parse(raw) as SprintDragPayload;
          if (!payload?.issueId) return;
          onDropIssue(payload);
        } catch {
          return;
        }
      }}
    >
      <div className="px-3 py-2 border-b border-(--border) flex items-center justify-between">
        <p className="text-sm">{title}</p>
        <p className="text-xs text-(--muted-2)">{issueCount}</p>
      </div>
      <div className="p-2 space-y-2">
        {children}
        {issueCount === 0 && (
          <p className="text-xs text-(--muted-2)">Drop issue here.</p>
        )}
      </div>
    </div>
  );
}

function SprintIssueCard({ issue }: { issue: IssueBody }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        const payload: SprintDragPayload = { issueId: issue.id };
        e.dataTransfer.setData("application/json", JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "move";
      }}
      className="rounded-md border border-[#2f2f2f] bg-[#0A0A0A] px-2 py-2 cursor-grab active:cursor-grabbing"
    >
      <p className="text-sm">{issue.title}</p>
      <p className="text-xs text-(--muted-2) mt-1">{issue.status || "Backlog"}</p>
    </div>
  );
}
