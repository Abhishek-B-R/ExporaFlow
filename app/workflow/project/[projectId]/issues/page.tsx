"use client";

import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import { IssueBody, ProjectBody } from "@/utils/types";
import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import IssueLabel from "@/components/workflow/issues/issue-label";
import { IssueViewOptArray } from "@/utils/issues-view-options";
import { CreateIssueWindow } from "@/components/workflow/issues/create-issue-window";
import IssuesTopTile from "@/components/workflow/issues/issues-top-tile";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { customToast } from "@/lib/custom-toast";

const activeTab =
  "flex h-7 items-center gap-x-1 cursor-pointer border border-[color:var(--border-strong)] px-2 rounded bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-3)] transition-all duration-300";
const inactiveTab =
  "flex h-7 items-center gap-x-1 cursor-pointer border border-[color:var(--border)] px-2 rounded bg-[color:var(--surface-1)] hover:bg-[color:var(--surface-2)] transition-all duration-300";

export default function Issue() {
  const routeParams = useParams<{ projectId: string }>();
  const path = usePathname();
  const [project_id, setProjectId] = useState<string | null>("");
  const [project, setProject] = useState<ProjectBody | null>(null);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const [issues, setIssues] = useState<IssueBody[]>();
  const [isLoading, setIsLoading] = useState(false);

  const [createIssueWindowOpen, setCreateIssueWindowOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [matchingIssueIds, setMatchingIssueIds] = useState<string[] | null>(null);
  const [isSavingView, setIsSavingView] = useState(false);
  const searchParams = useSearchParams();
  const latestSearchRequest = useRef(0);

  const filteredIssues = (issues ?? []).filter((issue) => {
    const statusMatch = statusFilter
      ? issue.status?.toLowerCase() === statusFilter.toLowerCase()
      : true;
    const searchMatch = matchingIssueIds ? matchingIssueIds.includes(issue.id) : true;
    return statusMatch && searchMatch;
  });

  useEffect(() => {
    const fetchIssues = async () => {
      if (!project_id) return;

      try {
        setIsLoading(true);
        const response = await axios.post("/api/issues/getissues", {
          project_id: project_id,
        });

        setIssues(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIssues();
  }, [project_id]);

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

  useEffect(() => {
    setProjectId(routeParams?.projectId ?? "");
  }, [routeParams?.projectId]);

  useEffect(() => {
    setStatusFilter(searchParams.get("status") ?? "");
    setSearchQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const currentRequest = ++latestSearchRequest.current;
    const controller = new AbortController();

    const runSearch = async () => {
      if (!project_id || !searchQuery.trim()) {
        setMatchingIssueIds(null);
        return;
      }
      try {
        const response = await axios.post("/api/search", {
            query: searchQuery,
            projectId: project_id,
          },
          { signal: controller.signal },
        );
        const ids = (response.data?.issues ?? []).map((issue: { id: string }) => issue.id);
        if (latestSearchRequest.current === currentRequest) {
          setMatchingIssueIds(ids);
        }
      } catch {
        if (latestSearchRequest.current === currentRequest) {
          setMatchingIssueIds([]);
        }
      }
    };
    runSearch();

    return () => {
      controller.abort();
    };
  }, [project_id, searchQuery]);

  const createIssue = async () => {
    try {
      const response = await axios.post("/api/issues/createissue", {
        issueTitle: issueTitle,
        issueDescription: issueDescription,
        projectId: project_id,
      });

      customToast.success({
        title: "Issue created",
        description: `Issue created succesfully!.`,
      });
    } catch (error) {
      customToast.error({
        title: "Action failed",
        description: `Error while creating issue.`,
      });
    }
  };

  const saveCurrentView = async () => {
    if (!project_id) return;
    const viewName = window.prompt("Name this view");
    if (!viewName?.trim()) return;

    try {
      setIsSavingView(true);
      await axios.post("/api/views", {
        name: viewName,
        projectId: project_id,
        filters: {
          statusFilter: statusFilter || undefined,
          searchText: searchQuery || undefined,
        },
      });
      customToast.success({
        title: "View saved",
        description: "Saved to Views for quick reuse.",
      });
    } catch {
      customToast.error({
        title: "Action failed",
        description: "Unable to save current view.",
      });
    } finally {
      setIsSavingView(false);
    }
  };

  return (
    <>
      <WorkflowLayout windowSvg={RAW_ICONS.Issue} windowTitle="Issues">
        <div className="border h-10 rounded border-[#2d3036] flex items-center justify-between px-4">
          <div className=" flex gap-x-2 items-center ">
            <Link
              href={"/workflow/project"}
              className="flex items-center rounded text-[12px] sm:text-[13px] md:text-[15px] border border-transparent  hover:border-[#2E3035] px-2 h-7  hover:bg-[#1C1D21] transition-all duration-300"
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
              href={`/workflow/project/${project_id}`}
              className={path.includes("/issues") ? inactiveTab : activeTab}
            >
              <SVGIcon className="flex w-4" svgString={RAW_ICONS.Docs} />
              <p className="text-[12px] sm:text-[13px] md:text-[15px]">
                Overview
              </p>
            </Link>
            <Link
              href={`/workflow/project/${project_id}/issues`}
              className={path.includes("/issues") ? activeTab : inactiveTab}
            >
              <SVGIcon className="flex w-4" svgString={RAW_ICONS.Issue} />
              <p className="text-[12px] sm:text-[13px] md:text-[15px]">
                Issues
              </p>
            </Link>
            <Link
              href={`/workflow/project/${project_id}/sprints`}
              className={path.includes("/sprints") ? activeTab : inactiveTab}
            >
              <SVGIcon className="flex w-4" svgString={RAW_ICONS.PlannedIssue} />
              <p className="text-[12px] sm:text-[13px] md:text-[15px]">
                Sprints
              </p>
            </Link>
            <Link
              href={`/workflow/project/${project_id}/backlog`}
              className={path.includes("/backlog") ? activeTab : inactiveTab}
            >
              <SVGIcon className="flex w-4" svgString={RAW_ICONS.DashedCircle} />
              <p className="text-[12px] sm:text-[13px] md:text-[15px]">
                Backlog
              </p>
            </Link>
            <Link
              href={`/workflow/project/${project_id}/board`}
              className={path.includes("/board") ? activeTab : inactiveTab}
            >
              <SVGIcon className="flex w-4" svgString={RAW_ICONS.Stack} />
              <p className="text-[12px] sm:text-[13px] md:text-[15px]">
                Board
              </p>
            </Link>
          </div>
          <div className="flex gap-1">
            <button
              onClick={saveCurrentView}
              disabled={isSavingView}
              className="flex h-7 items-center gap-x-1 cursor-pointer border border-[#2E3035] px-2 rounded-lg hover:bg-[#1C1D21] transition-all duration-300 text-xs"
            >
              {isSavingView ? "Saving..." : "Save view"}
            </button>
            <div
              onClick={() => {
                setCreateIssueWindowOpen(true);
              }}
              className="flex h-7 items-center gap-x-1 cursor-pointer border border-transparent  px-2 rounded-lg hover:bg-[#1C1D21] hover:border-[#2E3035] transition-all duration-300"
            >
              <SVGIcon className="flex w-4" svgString={RAW_ICONS.Add} />
            </div>
            <div className="flex h-7 items-center gap-x-1 cursor-pointer border border-transparent  px-2 rounded-lg hover:bg-[#1C1D21] hover:border-[#2E3035] transition-all duration-300">
              <SVGIcon className="flex w-5" svgString={RAW_ICONS.SideBar} />
            </div>
          </div>
        </div>

        <div
          className="
    h-10 border-b border-[#2E3035] flex items-center px-2 gap-x-2
    overflow-x-auto whitespace-nowrap
    sm:overflow-x-visible scrollbar-hide
  "
        >
          {IssueViewOptArray.map((elem, key) => (
            <IssuesViewButton
              key={key}
              title={elem.title}
              svg={elem.svg}
              filter={statusFilter}
              setFilter={setStatusFilter}
            />
          ))}
        </div>

        <div className="px-2 py-2 border-b border-[#2E3035]">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search issues in this project"
            className="w-full h-8 rounded border border-[#2E3035] bg-[#181A1E] px-2 text-sm"
          />
        </div>

        <IssuesTopTile />

        {isLoading ? (
          <div className="h-10 flex items-center justify-center">
            <SVGIcon svgString={RAW_ICONS.Loader} />
          </div>
        ) : (
          <div className="grow overflow-y-auto h-96 scrollbar-hide pt-1 ">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((elem, key) => {
                return (
                  <IssueLabel
                    key={key}
                    title={elem.title}
                    projectID={project_id}
                    projectKey={project?.title}
                    issueID={elem.id}
                    priority={elem.priority}
                    status={elem.status}
                    updatedAt={elem.updatedAt}
                  />
                );
              })
            ) : (
              <div className="h-10 flex items-center w-full justify-center">
                <p className="text-[#939494]">No Issues Found</p>
              </div>
            )}
          </div>
        )}
      </WorkflowLayout>

      {createIssueWindowOpen && (
        <CreateIssueWindow
          setClose={setCreateIssueWindowOpen}
          project_id={project_id}
          project_title={project?.title}
        />
      )}
    </>
  );
}

const IssuesViewButton = ({
  title,
  svg,
  filter,
  setFilter,
}: {
  title: string;
  svg: string;
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
}) => {
  return (
    <button
      onClick={
        title.toLowerCase() === "all issues"
          ? () => setFilter("")
          : () => setFilter(title)
      }
      className={
        (filter === title ? "bg-[#1C1D21] " : "") +
        "flex items-center gap-x-1 border border-[#2C2E34] h-7 px-2 rounded-md text-[#9a9a9a] text-sm hover:bg-[#1c1e22] transition-all duration-300 min-w-[90px] shrink-0"
      }
    >
      <SVGIcon className="flex w-4" svgString={svg} />
      <p className="truncate">{title}</p>
    </button>
  );
};
