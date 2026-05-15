"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import type { ProjectBody } from "@/utils/types";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { ProjectNavbar } from "@/components/workflow/project-navbar";
import { RAW_ICONS } from "@/lib/icons";
import Link from "next/link";

type Props = {
  projectId: string | undefined;
  children: React.ReactNode;
  /** Optional page title under the navbar */
  pageHeading?: string;
  pageSubheading?: string;
};

export function ProjectSubpageFrame({
  projectId,
  children,
  pageHeading,
  pageSubheading,
}: Props) {
  const [project, setProject] = useState<ProjectBody | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const run = async () => {
      try {
        const res = await axios.post("/api/workflow/project", { project_id: projectId });
        setProject(res.data ?? null);
      } catch {
        setProject(null);
      }
    };
    void run();
  }, [projectId]);

  const crumb = (
    <>
      <Link href="/workflow/project" className="hover:text-(--foreground) transition-colors">
        Projects
      </Link>
      <span className="text-(--muted-2)">/</span>
      <span className="truncate max-w-[140px]">{project?.title ?? "…"}</span>
    </>
  );

  return (
    <WorkflowLayout
      windowSvg={RAW_ICONS.RubiksCube}
      windowTitle="Projects"
      breadcrumb={crumb}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <ProjectNavbar projectId={projectId} projectTitle={project?.title} />
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <div className="ef-workspace-inner py-4">
            {pageHeading ? (
              <header className="mb-4">
                <h1 className="text-base font-semibold text-(--foreground) tracking-tight">
                  {pageHeading}
                </h1>
                {pageSubheading ? (
                  <p className="text-sm text-(--muted-2) mt-0.5 max-w-2xl">{pageSubheading}</p>
                ) : null}
              </header>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </WorkflowLayout>
  );
}
