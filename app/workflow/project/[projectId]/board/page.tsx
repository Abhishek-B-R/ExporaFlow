"use client";

import { IssueBody } from "@/utils/types";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ISSUE_STATUSES, IssueStatus } from "@/lib/issue-status-machine";
import { customToast } from "@/lib/custom-toast";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProjectBody } from "@/utils/types";

type DragPayload = {
  issueId: string;
};

export default function ProjectBoardPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const path = usePathname();

  const [issues, setIssues] = useState<IssueBody[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<ProjectBody | null>(null);

  const activeTab =
    "flex h-7 items-center gap-x-1 cursor-pointer border border-[#3a3a3a] px-2 rounded bg-[#0A0A0A] hover:bg-[#151515] transition-all duration-300";
  const inactiveTab =
    "flex h-7 items-center gap-x-1 cursor-pointer border border-[#2b2b2b] px-2 rounded bg-[#0A0A0A] hover:bg-[#131313] transition-all duration-300";

  const grouped = useMemo(() => {
    const map: Record<IssueStatus, IssueBody[]> = {
      Backlog: [],
      Planned: [],
      Working: [],
      Completed: [],
      Cancelled: [],
    };
    for (const issue of issues) {
      const status = (issue.status as IssueStatus) || "Backlog";
      if (status in map) map[status as IssueStatus].push(issue);
      else map.Backlog.push(issue);
    }
    return map;
  }, [issues]);

  useEffect(() => {
    if (!projectId) return;
    const fetchIssues = async () => {
      try {
        setIsLoading(true);
        const res = await axios.post("/api/issues/getissues", { project_id: projectId });
        setIssues(res.data ?? []);
      } catch {
        customToast.error({ title: "", description: "Failed to load issues." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchIssues();
  }, [projectId]);

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

  const onDropToStatus = async (toStatus: IssueStatus, payload: DragPayload) => {
    try {
      await axios.patch("/api/issues/updateissue", {
        issueId: payload.issueId,
        issueStatus: toStatus,
      });
      setIssues((prev) =>
        prev.map((i) => (i.id === payload.issueId ? { ...i, status: toStatus } : i)),
      );
    } catch (e) {
      customToast.error({ title: "", description: "Could not move issue." });
    }
  };

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

      <div className="grow min-h-screen px-3 md:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-medium">Board</p>
            <p className="text-sm text-(--muted-2)">
              Drag issues between columns or use quick move in a card.
            </p>
          </div>
        </div>
        {isLoading ? (
          <div className="text-sm text-(--muted-2)">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {ISSUE_STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                issues={grouped[status]}
                onDropToStatus={onDropToStatus}
                onQuickMove={onDropToStatus}
              />
            ))}
          </div>
        )}
      </div>
    </WorkflowLayout>
  );
}

function BoardColumn(props: {
  status: IssueStatus;
  issues: IssueBody[];
  onDropToStatus: (toStatus: IssueStatus, payload: DragPayload) => Promise<void>;
  onQuickMove: (toStatus: IssueStatus, payload: DragPayload) => Promise<void>;
}) {
  const { status, issues, onDropToStatus, onQuickMove } = props;

  return (
    <div
      className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A] overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        try {
          const payload = JSON.parse(raw) as DragPayload;
          if (!payload?.issueId) return;
          void onDropToStatus(status, payload);
        } catch {
          return;
        }
      }}
    >
      <div className="px-3 py-2 border-b border-[#2d2d2d] bg-[#101010] flex items-center justify-between">
        <p className="text-sm font-medium">{status}</p>
        <p className="text-xs text-(--muted-2)">{issues.length}</p>
      </div>

      <div className="p-2 flex flex-col gap-y-2 min-h-24">
        {issues.map((issue) => (
          <BoardCard key={issue.id} issue={issue} onQuickMove={onQuickMove} />
        ))}
        {issues.length === 0 && (
          <div className="text-xs text-(--muted-2) px-1 py-2">Drop issues here.</div>
        )}
      </div>
    </div>
  );
}

function BoardCard(props: {
  issue: IssueBody;
  onQuickMove: (toStatus: IssueStatus, payload: DragPayload) => Promise<void>;
}) {
  const { issue, onQuickMove } = props;

  return (
    <div
      draggable
      onDragStart={(e) => {
        const payload: DragPayload = { issueId: issue.id };
        e.dataTransfer.setData("application/json", JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "move";
      }}
      className="rounded-lg border border-[#2f2f2f] bg-[#0F0F0F] hover:bg-[#151515] transition-colors px-3 py-2 cursor-grab active:cursor-grabbing"
    >
      <p className="text-sm font-medium leading-snug">{issue.title}</p>
      <div className="mt-2">
        <select
          value={(issue.status as IssueStatus) ?? "Backlog"}
          onChange={(e) =>
            void onQuickMove(e.target.value as IssueStatus, { issueId: issue.id })
          }
          className="h-7 w-full text-xs rounded border border-[#2f2f2f] bg-[#0A0A0A] px-2 cursor-pointer"
        >
          {ISSUE_STATUSES.map((status) => (
            <option key={status} value={status}>
              Move to {status}
            </option>
          ))}
        </select>
      </div>
      {issue.priority && (
        <p className="text-xs text-(--muted-2) mt-1">{issue.priority}</p>
      )}
    </div>
  );
}

