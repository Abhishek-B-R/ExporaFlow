"use client";

import { IssueBody } from "@/utils/types";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ISSUE_STATUSES, IssueStatus } from "@/lib/issue-status-machine";
import { customToast } from "@/lib/custom-toast";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { ProjectBody } from "@/utils/types";
import { ProjectNavbar } from "@/components/workflow/project-navbar";
import { useProjectRole } from "@/hooks/use-project-role";

type DragPayload = {
  issueId: string;
};

export default function ProjectBoardPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const { can: canProject } = useProjectRole(projectId);
  const canMoveIssues = canProject("updateTicket");

  const [issues, setIssues] = useState<IssueBody[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<ProjectBody | null>(null);



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
    if (!canMoveIssues) return;
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
      <ProjectNavbar projectId={projectId} projectTitle={project?.title} />

      <div className="grow min-h-screen px-3 md:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-medium">Board</p>
            <p className="text-sm text-(--muted-2)">
              {canMoveIssues
                ? "Drag and drop issues between columns to change their status."
                : "View-only — you need Engineer access or higher to move issues."}
            </p>
          </div>
        </div>
        {isLoading ? (
          <div className="flex overflow-x-auto snap-x md:grid md:grid-cols-2 xl:grid-cols-5 gap-3 items-start pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="min-w-[85vw] md:min-w-0 snap-center rounded-lg border border-(--border) bg-(--surface-1) overflow-hidden shrink-0">
                <div className="px-3 py-2 border-b border-(--border) bg-(--surface-2)">
                  <div className="h-3.5 bg-(--surface-3) rounded w-1/2 animate-pulse" />
                </div>
                <div className="p-2 space-y-2">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="rounded-md border border-(--border) bg-(--surface-2) px-3 py-3 animate-pulse">
                      <div className="h-3 bg-(--surface-3) rounded w-3/4 mb-2" />
                      <div className="h-2.5 bg-(--surface-3) rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x md:grid md:grid-cols-2 xl:grid-cols-5 gap-3 items-start pb-4">
            {ISSUE_STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                issues={grouped[status]}
                onDropToStatus={onDropToStatus}
                canDrag={canMoveIssues}
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
  canDrag: boolean;
}) {
  const { status, issues, onDropToStatus, canDrag } = props;

  return (
    <div
      className="min-w-[85vw] md:min-w-0 snap-center rounded-lg border border-(--border) bg-(--surface-1) overflow-hidden shrink-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        if (!canDrag) return;
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
      <div className="px-3 py-2 border-b border-(--border) bg-(--surface-2) flex items-center justify-between sticky top-0 z-10">
        <p className="text-sm font-medium">{status}</p>
        <p className="text-xs text-(--muted-2)">{issues.length}</p>
      </div>

      <div className="p-2 flex flex-col gap-y-2 min-h-24">
        {issues.map((issue) => (
          <BoardCard key={issue.id} issue={issue} canDrag={canDrag} />
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
  canDrag: boolean;
}) {
  const { issue, canDrag } = props;
  const assignee = issue.User;
  const assigneeName = assignee?.name || assignee?.email || null;
  const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : null;

  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => {
        if (!canDrag) {
          e.preventDefault();
          return;
        }
        const payload: DragPayload = { issueId: issue.id };
        e.dataTransfer.setData("application/json", JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`rounded-md border border-(--border) bg-(--surface-2) hover:bg-(--surface-3) transition-colors px-3 py-2 ${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
    >
      <p className="text-sm font-medium leading-snug">{issue.title}</p>
      <div className="flex items-center justify-between mt-1.5">
        {issue.priority && (
          <p className="text-xs text-(--muted-2)">{issue.priority}</p>
        )}
        {assignee?.image ? (
          <img
            src={assignee.image}
            alt={assigneeName ?? ""}
            title={assigneeName ?? "Unassigned"}
            className="h-5 w-5 rounded-full object-cover border border-(--border) ml-auto"
          />
        ) : assigneeInitial ? (
          <div
            title={assigneeName ?? ""}
            className="h-5 w-5 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-[10px] font-medium text-sky-600 ml-auto"
          >
            {assigneeInitial}
          </div>
        ) : null}
      </div>
    </div>
  );
}

