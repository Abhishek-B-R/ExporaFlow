"use client";

import { IssueBody } from "@/utils/types";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { customToast } from "@/lib/custom-toast";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { ProjectBody } from "@/utils/types";
import { ProjectNavbar } from "@/components/workflow/project-navbar";

export default function ProjectBacklogPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const [issues, setIssues] = useState<IssueBody[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<ProjectBody | null>(null);



  const backlog = useMemo(
    () => issues.filter((i) => (i.status ?? "Backlog").toLowerCase() === "backlog"),
    [issues],
  );

  useEffect(() => {
    if (!projectId) return;
    const fetchIssues = async () => {
      try {
        setIsLoading(true);
        const res = await axios.post("/api/issues/getissues", { project_id: projectId });
        setIssues(res.data ?? []);
      } catch {
        customToast.error({ title: "", description: "Failed to load backlog." });
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

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Issue} windowTitle="Issues">
      <ProjectNavbar projectId={projectId} projectTitle={project?.title} />

      <div className="grow min-h-screen px-3 md:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-medium">Backlog</p>
            <p className="text-sm text-(--muted-2)">
              Issues that are not yet planned into a sprint.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-2 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border border-(--border) bg-(--surface-2) px-3 py-3 animate-pulse">
                <div className="h-3.5 bg-(--surface-3) rounded w-2/3 mb-2" />
                <div className="h-2.5 bg-(--surface-3) rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-(--border) bg-(--surface-1)">
            <div className="px-3 py-2 border-b border-(--border) bg-(--surface-2) flex items-center justify-between">
              <p className="text-sm font-medium">Backlog issues</p>
              <p className="text-xs text-(--muted-2)">{backlog.length}</p>
            </div>
            <div className="p-2 flex flex-col gap-y-2">
              {backlog.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-(--border) bg-(--surface-2) px-3 py-2"
                >
                  <p className="text-sm font-medium">{issue.title}</p>
                  {issue.description && (
                    <p className="text-xs text-(--muted-2) mt-1 line-clamp-2">
                      {issue.description}
                    </p>
                  )}
                </div>
              ))}
              {backlog.length === 0 && (
                <div className="text-sm text-(--muted-2) px-2 py-6">
                  Nothing in backlog yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </WorkflowLayout>
  );
}

