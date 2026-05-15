"use client";

import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import {
  ProjectBody,
  ProjectPriorityType,
  ProjectStatusType,
} from "@/utils/types";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import ProjectListSkeleton from "./project-skeleton-loader";
import { WorkflowLayout } from "../workflow-layout";
import { renderPrioritySvg } from "../issues/issue-label";
import {
  healthOptions,
  priorityOptionsArray,
} from "@/utils/project-view-options";
import { customToast } from "@/lib/custom-toast";
import {
  PROJECT_SERVICE_LINES,
  type ProjectServiceLineValue,
  projectServiceLineLabel,
} from "@/utils/project-service-line";

function formatProjectDate(value: unknown): string {
  if (value == null || value === "") return "—";
  try {
    const d = new Date(value as string | number | Date);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function leadLabel(project: ProjectBody): string {
  const l = project.lead?.trim();
  if (l) return l;
  const n = project.creator?.name?.trim();
  if (n) return n;
  const e = project.creator?.email?.trim();
  if (e) return e;
  return "—";
}

function stateBadgeClass(name: string) {
  const n = name.toLowerCase();
  if (n.includes("work")) return "bg-emerald-500/12 text-emerald-200 border-emerald-500/25";
  if (n.includes("plan")) return "bg-sky-500/12 text-sky-200 border-sky-500/25";
  if (n.includes("backlog")) return "bg-slate-500/15 text-slate-200 border-slate-500/25";
  if (n.includes("complete")) return "bg-zinc-500/12 text-zinc-200 border-zinc-500/25";
  if (n.includes("cancel")) return "bg-orange-500/12 text-orange-200 border-orange-500/25";
  return "bg-(--surface-3) text-(--muted) border-(--border)";
}

export default function Projects() {
  const [deleteProjectId, setDeleteProjectId] = useState("");
  const [deleteWindowOpen, setDeleteWindowOpen] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/");
    },
  });

  const [createWindowOpen, setCreateWindowOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectBody[]>();
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/workflow/getprojects");
      setProjects(response.data);
    } catch (error) {
      customToast.error({
        title: "Action failed",
        description: "Failed to fetch projects.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (status === "loading") {
    return <ProjectListSkeleton />;
  }

  return (
    <>
      <WorkflowLayout
        windowSvg={RAW_ICONS.RubiksCube}
        windowTitle="Projects"
        breadcrumb={
          <span className="text-(--muted-2) text-xs font-medium tracking-tight">
            Workspace / <span className="text-(--muted)">Delivery</span>
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => setCreateWindowOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border) bg-(--surface-2) px-2.5 text-xs font-medium text-(--foreground) hover:bg-(--surface-3) transition-colors"
          >
            <SVGIcon className="flex w-3.5 h-3.5" svgString={RAW_ICONS.Add} />
            New project
          </button>
        }
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="shrink-0 border-b border-(--border) bg-(--surface-2) px-3 md:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-(--muted-2)">
                Portfolio
              </p>
              <p className="text-sm font-semibold text-(--foreground)">All projects</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-(--muted-2)">
              <span className="hidden sm:inline">Operational view</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto scrollbar-hide">
            <div className="ef-workspace-inner py-3">
              {isLoading ? (
                <div className="h-32 flex items-center justify-center text-(--muted-2)">
                  <SVGIcon className="flex w-8 h-8 animate-pulse" svgString={RAW_ICONS.Loader} />
                </div>
              ) : null}

              {!isLoading && projects && projects.length > 0 ? (
                <div className="rounded-md border border-(--border) bg-(--surface-1) overflow-hidden shadow-sm">
                  <table className="w-full text-[13px] border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-(--border) bg-(--surface-2) text-left text-[11px] font-semibold uppercase tracking-wide text-(--muted-2)">
                        <th className="px-3 py-2 w-[22%] font-medium">Project</th>
                        <th className="px-3 py-2 w-[14%] font-medium hidden lg:table-cell">Service</th>
                        <th className="px-3 py-2 w-[12%] font-medium hidden lg:table-cell">Health</th>
                        <th className="px-3 py-2 w-[12%] font-medium">Status</th>
                        <th className="px-3 py-2 w-[8%] font-medium">Priority</th>
                        <th className="px-3 py-2 w-[12%] font-medium hidden md:table-cell">Lead</th>
                        <th className="px-3 py-2 w-[11%] font-medium hidden xl:table-cell">Target</th>
                        <th className="px-3 py-2 w-[11%] font-medium hidden lg:table-cell">Tickets</th>
                        <th className="px-3 py-2 w-[10%] font-medium hidden xl:table-cell">SLA</th>
                        <th className="px-3 py-2 w-[10%] font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((elem) => (
                        <ProjectLabel
                          key={elem.id}
                          project={elem}
                          openDeleteWindow={setDeleteWindowOpen}
                          setProjectIdToDelete={setDeleteProjectId}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {!isLoading && (!projects || projects.length === 0) ? (
                <div className="rounded-md border border-dashed border-(--border) bg-(--surface-2)/40 px-4 py-12 text-center text-sm text-(--muted-2)">
                  No projects yet. Create one to get started.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </WorkflowLayout>

      {createWindowOpen && (
        <CreateProjectWindow setClose={setCreateWindowOpen} />
      )}
      {deleteWindowOpen && (
        <DeleteWindow
          closeDeleteWindow={setDeleteWindowOpen}
          projectID={deleteProjectId}
        />
      )}
    </>
  );
}

const ProjectLabel = ({
  project,
  openDeleteWindow,
  setProjectIdToDelete,
}: {
  project: ProjectBody;
  openDeleteWindow: React.Dispatch<React.SetStateAction<boolean>>;
  setProjectIdToDelete: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const projectID = project.id;
  const [selectedHealthOption, setSelectedHealthOption] = useState(project.status);

  const [showOptionsDropdown, setShowOptionsDropdown] = useState<
    "health" | "priority" | boolean
  >(false);

  const healthDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedPriorityOption, setSelectedPriorityOption] = useState(project.priority);

  useEffect(() => {
    setSelectedHealthOption(project.status);
  }, [project.status]);

  useEffect(() => {
    setSelectedPriorityOption(project.priority);
  }, [project.priority]);

  const handleHealthOptionClick = async (option: string) => {
    setSelectedHealthOption(option);
    setShowOptionsDropdown(false);
    try {
      const response = await axios.patch("/api/workflow/updateproject", {
        projectId: projectID,
        status: option,
      });
      if (response.status === 200) {
        customToast.info({
          title: "Status changed!",
          description: `Status set to ${option} successfully.`,
        });
      } else {
        customToast.error({
          title: "",
          description: "Failed to update project.",
        });
      }
    } catch (error) {
      console.error("Error updating project:", error);
      customToast.error({
        title: "",
        description: "Failed to update project.",
      });
    }
  };

  const handlePriorityOptionClick = async (option: string) => {
    setSelectedPriorityOption(option);
    setShowOptionsDropdown(false);
    try {
      const response = await axios.patch("/api/workflow/updateproject", {
        projectId: projectID,
        priority: option,
      });
      if (response.status === 200) {
        customToast.info({
          title: "Priority changed!",
          description: `Priority set to ${option} successfully.`,
        });
      } else {
        customToast.error({
          title: "",
          description: "Failed to update project.",
        });
      }
    } catch (error) {
      console.error("Error updating project:", error);
      customToast.error({
        title: "",
        description: "Failed to update project.",
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showOptionsDropdown === "health" &&
        healthDropdownRef.current &&
        !healthDropdownRef.current.contains(event.target as Node)
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

  const stats = project.stats;
  const ticketTotal =
    stats != null ? stats.incidentTickets + stats.changeTickets : 0;
  const menuPanel =
    "z-20 absolute top-full left-0 mt-1 min-w-[10rem] rounded-md border border-(--border) bg-(--surface-1) py-0.5 shadow-lg";

  return (
    <tr className="border-b border-(--border)/60 last:border-b-0 hover:bg-(--surface-2)/35 transition-colors">
      <td className="px-3 py-2 align-top">
        <Link
          href={`/workflow/project/${projectID}`}
          className="font-semibold text-[13px] text-(--foreground) hover:text-(--accent) leading-snug line-clamp-2"
        >
          {project.title}
        </Link>
        {project.description ? (
          <p className="text-[11px] text-(--muted-2) line-clamp-1 mt-0.5">{project.description}</p>
        ) : null}
      </td>
      <td className="px-3 py-2 align-middle hidden lg:table-cell">
        <span
          className="inline-flex max-w-full truncate rounded border border-(--border) bg-(--surface-2) px-1.5 py-0.5 text-[11px] font-medium text-(--muted)"
          title={projectServiceLineLabel(project.serviceLine)}
        >
          {projectServiceLineLabel(project.serviceLine)}
        </span>
      </td>
      <td className="px-3 py-2 align-middle hidden lg:table-cell">
        <span
          className="inline-flex max-w-full truncate rounded border border-(--border) bg-(--surface-2)/80 px-1.5 py-0.5 text-[11px] font-medium text-(--muted-2)"
          title={project.health ?? ""}
        >
          {(project.health ?? "").trim() || "—"}
        </span>
      </td>
      <td className="px-3 py-2 align-middle">
        <div className="relative inline-block" ref={healthDropdownRef}>
          <button
            type="button"
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${stateBadgeClass(selectedHealthOption)}`}
            onClick={() => setShowOptionsDropdown((v) => (v === "health" ? false : "health"))}
          >
            {selectedHealthOption}
          </button>
          {showOptionsDropdown === "health" ? (
            <div className={menuPanel}>
              {healthOptions.map((option, key) => (
                <button
                  type="button"
                  key={key}
                  className="w-full px-2.5 py-1.5 text-left text-[12px] text-(--foreground) hover:bg-(--surface-2) flex items-center gap-2"
                  onClick={() => handleHealthOptionClick(option.name)}
                >
                  <SVGIcon className="flex w-4 shrink-0" svgString={option.svg} />
                  {option.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-2 align-middle">
        <div className="relative inline-flex" ref={priorityDropdownRef}>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-(--border) bg-(--surface-2) hover:bg-(--surface-3) transition-colors"
            onClick={() => setShowOptionsDropdown((v) => (v === "priority" ? false : "priority"))}
            aria-label="Change priority"
          >
            {renderPrioritySvg(selectedPriorityOption)}
          </button>
          {showOptionsDropdown === "priority" ? (
            <div className={menuPanel}>
              {priorityOptionsArray.map((option, key) => (
                <button
                  type="button"
                  key={key}
                  className="w-full px-2.5 py-1.5 text-left text-[12px] text-(--foreground) hover:bg-(--surface-2) flex items-center gap-2"
                  onClick={() => handlePriorityOptionClick(option.name)}
                >
                  <SVGIcon className="flex w-4 shrink-0" svgString={option.svg} />
                  {option.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-2 align-middle text-(--muted) text-[12px] hidden md:table-cell max-w-[140px]">
        <span className="line-clamp-2" title={leadLabel(project)}>
          {leadLabel(project)}
        </span>
      </td>
      <td className="px-3 py-2 align-middle text-(--muted) text-[12px] tabular-nums hidden xl:table-cell">
        {formatProjectDate(project.targetDate)}
      </td>
      <td className="px-3 py-2 align-middle hidden lg:table-cell">
        {stats ? (
          <div className="flex flex-col gap-0.5 text-[11px]">
            <span className="text-(--muted) tabular-nums">
              <span className="font-medium text-(--foreground)">{stats.incidentTickets}</span>{" "}
              inc
            </span>
            <span className="text-(--muted) tabular-nums">
              <span className="font-medium text-(--foreground)">{stats.changeTickets}</span> chg
            </span>
            {ticketTotal > 0 ? (
              <div className="mt-1 h-1 w-full max-w-[72px] rounded-full bg-(--surface-3) overflow-hidden">
                <div
                  className="h-full rounded-full bg-(--accent)/50"
                  style={{
                    width: `${Math.min(100, Math.round((stats.changeTickets / ticketTotal) * 100))}%`,
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-(--muted-2)">—</span>
        )}
      </td>
      <td className="px-3 py-2 align-middle hidden xl:table-cell">
        {stats && stats.slaAtRisk > 0 ? (
          <span className="inline-flex items-center rounded border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-medium text-rose-200 tabular-nums">
            {stats.slaAtRisk} at risk
          </span>
        ) : stats ? (
          <span className="inline-flex items-center rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-200">
            Clear
          </span>
        ) : (
          <span className="text-(--muted-2)">—</span>
        )}
      </td>
      <td className="px-3 py-2 align-middle text-right">
        <button
          type="button"
          onClick={() => {
            setProjectIdToDelete(projectID);
            openDeleteWindow(true);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-(--muted-2) hover:text-(--danger) hover:bg-(--surface-2) hover:border-(--border) transition-colors"
          aria-label="Delete project"
        >
          <SVGIcon className="flex w-4" svgString={RAW_ICONS.Delete} />
        </button>
      </td>
    </tr>
  );
};

const CreateProjectWindow = ({
  setClose,
}: {
  setClose: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [projTitle, setProjTitle] = useState("");
  const [projDescription, setProjDescription] = useState("");
  const [projContent, setProjContent] = useState("");
  const [status, setStatus] = useState<ProjectStatusType>("Backlog");
  const [priority, setPriority] = useState<ProjectPriorityType>("No Priority");
  const [serviceLine, setServiceLine] = useState<ProjectServiceLineValue | null>(
    null,
  );
  type CustomerRow = { id: string; name: string; organizationName: string };
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [showOptionsDropdown, setShowOptionsDropdown] = useState<
    "health" | "priority" | boolean
  >(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    "Completed",
    "Backlog",
    "Working",
    "Cancelled",
    "Planned",
  ];

  const priorityOptions = ["No Priority", "Urgent", "High", "Medium", "Low"];

  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get<CustomerRow[]>("/api/customers");
        setCustomers(res.data ?? []);
      } catch {
        setCustomers([]);
      }
    };
    void load();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.organizationName.toLowerCase().includes(q)
    );
  });

  const createProject = async () => {
    setIsCreating(true);
    let shouldClose = true;
    try {
      const response = await axios.post("/api/workflow/createproject", {
        projTitle: projTitle,
        projDescription: projDescription,
        projContent: projContent,
        createdBy: session?.user.id,
        priority: priority,
        status: status,
        serviceLine,
        customerId: customerId ?? undefined,
      });

      customToast.info({
        title: "",
        description: "Project created succesfully!",
      });
    } catch (error) {
      const description = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Could not create project."
        : "Could not create project.";
      customToast.error({
        title: "",
        description,
      });
      shouldClose = !(axios.isAxiosError(error) && error.response?.status === 409);
    } finally {
      if (shouldClose) setClose(false);
      setIsCreating(false);
    }
  };

  return (
    <div className="absolute bg-[rgba(0,0,0,0.1)] backdrop-blur-lg w-full min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-14 xl:px-44">
      {/* Main content */}
      <div className="flex flex-col border border-[#393B42] w-full h-[550px] lg:h-[600px] xl:h-[700px] rounded-xl bg-[#0F1111] px-2 md:px-4 xl:px-5 pt-2 md:pt-4 xl:pt-5">
        <div className=" h-10 flex justify-between items-center gap-x-2">
          <div className="flex items-center">
            <div className="border border-[#2E3035] bg-[#1C1D21] rounded h-7 md:h-9 w-16 md:w-20 flex justify-center items-center">
              <p className="text-[12px] md:text-[14px] xl:text-[16px]">Team</p>
            </div>
            <SVGIcon className="flex w-t" svgString={RAW_ICONS.ArrowRight} />
            <p className="text-[12px] md:text-[14px] xl:text-[16px]">
              New Project
            </p>
          </div>
          <div onClick={() => setClose(false)} className="w-fit cursor-pointer">
            <SVGIcon className="flex w-3 md:w-5" svgString={RAW_ICONS.Close} />
          </div>
        </div>

        <div id="title" className="mt-5">
          <input
            className=" text-xl sm:text-2xl md:text-3xl w-full outline-none"
            placeholder="Project name"
            value={projTitle}
            onChange={(e) => {
              setProjTitle(e.target.value);
            }}
          />
          <input
            id="description"
            className="text-sm md:text-lg w-full outline-none mt-3"
            placeholder="Add some description…"
            value={projDescription}
            onChange={(e) => {
              setProjDescription(e.target.value);
            }}
          />
        </div>

        <div className="mt-4">
          <p className="text-[11px] md:text-xs text-[#858687] mb-2">
            Service line
          </p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_SERVICE_LINES.map((line) => {
              const selected = serviceLine === line.value;
              return (
                <button
                  key={line.value}
                  type="button"
                  onClick={() => setServiceLine(line.value)}
                  className={`rounded-md border px-2.5 py-1.5 text-[11px] md:text-[13px] transition-all duration-300 ${
                    selected
                      ? "border-[#6D78E7] bg-[#2a2f4a] text-white"
                      : "border-[#525353] bg-[#1D1D21] text-[#c5c6c8] hover:bg-[#29292e]"
                  }`}
                >
                  {line.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[11px] md:text-xs text-[#858687] mb-2">Customer</p>
          <input
            className="w-full rounded-md border border-[#525353] bg-[#1D1D21] px-2 py-1.5 text-sm outline-none"
            placeholder="Search customers…"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          <div className="mt-2 max-h-28 overflow-y-auto rounded-md border border-[#525353] bg-[#151518]">
            <button
              type="button"
              className={`w-full text-left px-2 py-1.5 text-xs hover:bg-[#29292e] ${
                customerId === null ? "bg-[#2a2f4a]" : ""
              }`}
              onClick={() => setCustomerId(null)}
            >
              No customer
            </button>
            {filteredCustomers.slice(0, 40).map((c) => (
              <button
                key={c.id}
                type="button"
                className={`w-full text-left px-2 py-1.5 text-xs hover:bg-[#29292e] ${
                  customerId === c.id ? "bg-[#2a2f4a]" : ""
                }`}
                onClick={() => setCustomerId(c.id)}
              >
                <span className="font-medium">{c.organizationName}</span>
                <span className="text-[#858687]"> · {c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="my-2 h-10 gap-x-2 flex items-center  text-[10px]  md:text-[14px] lg:text-[15px] xl:text-[16px] ">
          <button
            onClick={() => setShowOptionsDropdown("health")}
            className="border border-[#525353] flex items-center  bg-[#1D1D21] h-8 px-2 lg:px-3 rounded-md hover:bg-[#29292e] transition-all duration-300"
          >
            {status}
          </button>
          {showOptionsDropdown == "health" && (
            <div className="absolute bg-[#1D1D21] border border-[#525353] rounded-md mt-2">
              {statusOptions.map((option, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-[#29292e] cursor-pointer rounded"
                  onClick={() => {
                    //@ts-expect-error //status type differ
                    setStatus(option);
                    setShowOptionsDropdown(false);
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowOptionsDropdown("priority")}
            className="border border-[#525353] flex items-center bg-[#1D1D21] h-8 px-2 lg:px-3 rounded-md hover:bg-[#29292e] transition-all duration-300"
          >
            {priority}
          </button>
          {showOptionsDropdown == "priority" && (
            <div className="absolute bg-[#1D1D21] border border-[#525353] rounded-md mt-2">
              {priorityOptions.map((option, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-[#29292e] cursor-pointer rounded"
                  onClick={() => {
                    //@ts-expect-error //project type is different
                    setPriority(option);
                    setShowOptionsDropdown(false);
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}

          <button className="border border-[#525353] bg-[#1D1D21] h-8 px-2 lg:px-3 rounded-md hover:bg-[#29292e] transition-all duration-300">
            lead
          </button>
          <button className="border border-[#525353] bg-[#1D1D21] h-8 px-2 lg:px-3 rounded-md hover:bg-[#29292e] transition-all duration-300">
            members
          </button>
          <button className="border border-[#525353] bg-[#1D1D21] h-8 px-2 lg:px-3 rounded-md hover:bg-[#29292e] transition-all duration-300">
            start date
          </button>
          <button className="border border-[#525353] bg-[#1D1D21] h-8 px-2 lg:px-3 rounded-md hover:bg-[#29292e] transition-all duration-300">
            target date
          </button>
        </div>

        <div className="border-t border-[#525353] mt-1 sm:mt-2 md:mt-3"></div>
        <div
          id="content"
          className="grow mt-2 sm:mt-5 md:mt-10 font-extralight"
        >
          <textarea
            className=" text-[14px]  lg:text-[15px] xl:text-lg w-full outline-none h-full resize-none"
            placeholder="Add project brief, long description, collect ideas and resources…"
            value={projContent}
            onChange={(e) => {
              setProjContent(e.target.value);
            }}
          />
        </div>

        <div className="border-t border-[#393B42] w-full h-20 flex items-center justify-end gap-x-3  text-[12px]  md:text-[14px] lg:text-[15px] xl:text-[16px] ">
          <button
            onClick={() => setClose(false)}
            className="px-2 border border-[#393B42] rounded-md h-9 hover:bg-[#23252A] transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={createProject}
            disabled={
              isCreating || !projTitle.trim() || serviceLine === null
            }
            className="px-2 border border-[#6D78E7] bg-[#5E6AD2] min-w-16 flex items-center justify-center rounded-md h-9 hover:bg-[#6D78E7] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isCreating ? (
              <SVGIcon svgString={RAW_ICONS.WhiteLoader} />
            ) : (
              "Create"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteWindow = ({
  projectID,
  closeDeleteWindow,
}: {
  projectID: string;
  closeDeleteWindow: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteProject = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete("/api/workflow/deleteproject", {
        data: { projectId: projectID },
        headers: { "Content-Type": "application/json" },
      });
      customToast.info({
        title: "",
        description: "Project deleted succesfully!",
      });
    } catch (error) {
      customToast.error({
        title: "",
        description: `Error occured: ${error}`,
      });
    } finally {
      closeDeleteWindow(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="absolute bg-[rgba(0,0,0,0.1)] backdrop-blur-lg w-full min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-14 xl:px-44">
      {/* Main content */}
      <div className="flex flex-col justify-between border border-[#393B42] rounded-xl bg-[#0F1111] h-56 w-96 lg:w-[500px] p-4">
        <div className="">
          <p className="font-bold text-2xl">Are you sure?</p>
          <p className="text-[#f2534d]">
            Deleting this project will automatically delete all the issues
            related under this project.
          </p>
        </div>
        <div className="flex items-center justify-end gap-x-2 h-10">
          <button
            onClick={() => closeDeleteWindow(false)}
            className="border border-[#8c8e85] bg-[#8c8e8533] h-9 w-20 rounded-lg  hover:bg-[#908d8c5e] hover:text-white transition-all duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={deleteProject}
            disabled={isDeleting}
            className="border border-[#9e3e28] flex items-center justify-center bg-[#421c1370] h-9 w-20 rounded-lg text-[#cb4b2e] hover:bg-[#421c13] hover:text-white transition-all duration-200 cursor-pointer"
          >
            {isDeleting ? (
              <SVGIcon svgString={RAW_ICONS.RedDeleteLoader} />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
