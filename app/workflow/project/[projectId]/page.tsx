"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ProjectBody } from "@/utils/types";
import SVGIcon from "@/lib/svg-icon";
import ProjectLoadingScreen from "@/components/workflow/workspace/project-loading";
import { RAW_ICONS } from "@/lib/icons";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { TopTileButton } from "@/components/workflow/workflow-toptile-layout";
import { toast } from "sonner";
import { renderPrioritySvg } from "@/utils/render-priority-svg";
import { ProjectNavbar } from "@/components/workflow/project-navbar";
import {
  healthOptions,
  priorityOptionsArray,
} from "@/utils/project-view-options";
import { customToast } from "@/lib/custom-toast";
import { projectServiceLineLabel } from "@/utils/project-service-line";



export default function Project({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [selectedHealthOption, setSelectedHealthOption] = useState("");
  const [selectedPriorityOption, setSelectedPriorityOption] = useState("");

  const [showOptionsDropdown, setShowOptionsDropdown] = useState<
    "status" | "priority" | boolean
  >(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  const [project_id, setProjectID] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectBody | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setProjectID(resolvedParams.projectId);
      localStorage.setItem("EXPORA_PROJECT_ID", resolvedParams.projectId);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    const fetchUniqueProject = async () => {
      if (!project_id) return;

      try {
        setIsLoading(true);
        const response = await axios.post("/api/workflow/project", {
          project_id: project_id,
        });

        setProject(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUniqueProject();
  }, [project_id]);

  const handleHealthOptionClick = async (option: string) => {
    setSelectedHealthOption(option);

    setShowOptionsDropdown(false);
    try {
      const response = await axios.patch("/api/workflow/updateproject", {
        projectId: project_id,
        status: option,
      });
      if (response.status === 200) {
        customToast.info({
          title: "Status changed!",
          description: `Status set to ${option} successfully.`,
        });
      } else {
        customToast.error({
          title: "Action failed",
          description: `Failed to update status.`,
        });
      }
    } catch (error) {
      customToast.error({
        title: "Action failed",
        description: `Failed to update status.`,
      });
    }
  };

  const handlePriorityOptionClick = async (option: string) => {
    setSelectedPriorityOption(option);
    setShowOptionsDropdown(false);
    try {
      const response = await axios.patch("/api/workflow/updateproject", {
        projectId: project_id,
        priority: option,
      });
      if (response.status === 200) {
        customToast.info({
          title: "Priority changed!",
          description: `Priority set to ${option} successfully.`,
        });
      } else {
        customToast.error({
          title: "Action failed",
          description: `Failed to update priority.`,
        });
      }
    } catch (error) {
      customToast.error({
        title: "Action failed",
        description: `Failed to update priority.`,
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showOptionsDropdown === "status" &&
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowOptionsDropdown(false);
      }

      if (
        showOptionsDropdown === "priority" &&
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setShowOptionsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsDropdown]);

  return (
    <>
      {isLoading ? (
        <ProjectLoadingScreen />
      ) : (
        <WorkflowLayout
          windowSvg={RAW_ICONS.RubiksCube}
          windowTitle="Projects"
          breadcrumb={
            <>
              <Link
                href="/workflow/project"
                className="hover:text-(--foreground) transition-colors shrink-0"
              >
                Projects
              </Link>
              <span className="text-(--muted-2) shrink-0">/</span>
              <span className="truncate text-(--muted)">{project?.title ?? "…"}</span>
            </>
          }
        >
          <div className="flex flex-col flex-1 min-h-0">
            <ProjectNavbar projectId={project_id} projectTitle={project?.title} />

            {project && (
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                <div className="ef-workspace-inner py-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-(--foreground)">
                      {project.title}
                    </h1>
                    {project.serviceLine ? (
                      <span className="text-[11px] font-medium text-(--muted) border border-(--border) rounded-md px-2 py-0.5 bg-(--surface-2)">
                        {projectServiceLineLabel(project.serviceLine)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-(--muted-2) max-w-3xl">{project.description}</p>

                  <div className="flex flex-wrap gap-2 my-6 text-xs">
                    <div
                      ref={statusDropdownRef}
                      className="h-8 relative rounded-md flex items-center border border-(--border) bg-(--surface-2) cursor-pointer hover:bg-(--surface-3) transition-colors"
                    >
                      <div
                        className="h-full px-3 flex items-center rounded-md text-(--foreground) font-medium"
                        onClick={() => setShowOptionsDropdown("status")}
                      >
                        {project.status ? project.status : "Status"}
                      </div>
                      {showOptionsDropdown == "status" && (
                        <div className="z-10 absolute top-full left-0 mt-1 min-w-[10rem] rounded-md border border-(--border) bg-(--surface-1) py-0.5 shadow-lg">
                          {healthOptions.map((option, key) => (
                            <button
                              type="button"
                              key={key}
                              className="w-full px-2.5 py-1.5 text-left text-[12px] text-(--foreground) hover:bg-(--surface-2) flex items-center gap-2"
                              onClick={() => handleHealthOptionClick(option.name)}
                            >
                              <SVGIcon className="flex w-4" svgString={option.svg} />
                              {option.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      ref={priorityDropdownRef}
                      className="h-8 w-8 relative rounded-md flex items-center justify-center border border-(--border) bg-(--surface-2) cursor-pointer hover:bg-(--surface-3) transition-colors"
                    >
                      <div
                        className="flex items-center justify-center w-full h-full rounded-md"
                        onClick={() => setShowOptionsDropdown("priority")}
                      >
                        {renderPrioritySvg(project.priority)}
                      </div>
                      {showOptionsDropdown == "priority" && (
                        <div className="z-10 absolute top-full left-0 mt-1 min-w-[10rem] rounded-md border border-(--border) bg-(--surface-1) py-0.5 shadow-lg">
                          {priorityOptionsArray.map((option, key) => (
                            <button
                              type="button"
                              key={key}
                              className="w-full px-2.5 py-1.5 text-left text-[12px] text-(--foreground) hover:bg-(--surface-2) flex items-center gap-2"
                              onClick={() => handlePriorityOptionClick(option.name)}
                            >
                              <SVGIcon className="flex w-3" svgString={option.svg} />
                              {option.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="h-8 px-3 rounded-md flex items-center border border-(--border) bg-(--surface-2) text-(--muted) text-[12px]">
                      Lead: {project.lead?.trim() || "—"}
                    </div>
                    <div className="h-8 px-3 rounded-md flex items-center border border-(--border) bg-(--surface-2) text-(--muted) text-[12px]">
                      Start:{" "}
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString()
                        : "—"}
                    </div>
                    <div className="h-8 px-3 rounded-md flex items-center border border-(--border) bg-(--surface-2) text-(--muted) text-[12px]">
                      End:{" "}
                      {project.targetDate
                        ? new Date(project.targetDate).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>

                  <div className="border-t border-(--border) pt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-(--muted-2) mb-2">
                      Brief
                    </p>
                    <div className="text-sm text-(--muted) leading-relaxed whitespace-pre-wrap">
                      {project.content}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </WorkflowLayout>
      )}
    </>
  );
}
