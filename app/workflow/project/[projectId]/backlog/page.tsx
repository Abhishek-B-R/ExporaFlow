"use client";

import { IssueBody } from "@/utils/types";
import axios from "axios";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { customToast } from "@/lib/custom-toast";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import { ProjectBody } from "@/utils/types";

export default function ProjectBacklogPage() {
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
            <p className="text-lg font-medium">Backlog</p>
            <p className="text-sm text-(--muted-2)">
              Issues that are not yet planned into a sprint.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A] p-2 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border border-[#2f2f2f] bg-[#0F0F0F] px-3 py-3 animate-pulse">
                <div className="h-3.5 bg-[#1a1a1a] rounded w-2/3 mb-2" />
                <div className="h-2.5 bg-[#1a1a1a] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#2d2d2d] bg-[#0A0A0A]">
            <div className="px-3 py-2 border-b border-[#2d2d2d] bg-[#101010] flex items-center justify-between">
              <p className="text-sm font-medium">Backlog issues</p>
              <p className="text-xs text-(--muted-2)">{backlog.length}</p>
            </div>
            <div className="p-2 flex flex-col gap-y-2">
              {backlog.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-[#2f2f2f] bg-[#0F0F0F] px-3 py-2"
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

