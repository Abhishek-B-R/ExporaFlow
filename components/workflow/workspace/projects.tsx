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
import {
  WorkflowModal,
  WorkflowModalBody,
  WorkflowModalFooter,
  WorkflowModalHeader,
} from "../workflow-modal";
import { renderPrioritySvg } from "../issues/issue-label";
import {
  healthOptions,
  priorityOptionsArray,
} from "@/utils/project-view-options";
import { customToast } from "@/lib/custom-toast";
import {
  type ProjectServiceLineValue,
  projectServiceLineLabel,
} from "@/utils/project-service-line";
import { EnterpriseDatePicker } from "@/components/workflow/enterprise-date-picker";
import { ServiceLineSelect } from "@/components/workflow/service-line-select";
import { CustomerPicker } from "@/components/workflow/customer-picker";

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

function formatProjectDateRange(
  start: unknown,
  target: unknown,
): string {
  const s = formatProjectDate(start);
  const t = formatProjectDate(target);
  if (s === "—" && t === "—") return "—";
  if (s !== "—" && t !== "—") return `${s} → ${t}`;
  return s !== "—" ? `From ${s}` : `Until ${t}`;
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
  if (n.includes("work")) return "bg-emerald-50 text-emerald-800 border-emerald-300";
  if (n.includes("plan")) return "bg-sky-50 text-sky-800 border-sky-300";
  if (n.includes("backlog")) return "bg-slate-100 text-slate-700 border-slate-300";
  if (n.includes("complete")) return "bg-zinc-100 text-zinc-700 border-zinc-300";
  if (n.includes("cancel")) return "bg-orange-50 text-orange-800 border-orange-300";
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
                        <th className="px-3 py-2 w-[13%] font-medium hidden xl:table-cell">Timeline</th>
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
        {formatProjectDateRange(project.startDate, project.targetDate)}
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
          <span className="inline-flex items-center rounded border border-rose-300 bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 tabular-nums">
            {stats.slaAtRisk} at risk
          </span>
        ) : stats ? (
          <span className="inline-flex items-center rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
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
  type CustomerRow = {
    id: string;
    name: string;
    organizationName: string;
    isActive?: boolean;
  };
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");

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

  const loadCustomers = async () => {
    try {
      const res = await axios.get<CustomerRow[]>("/api/customers");
      setCustomers((res.data ?? []).filter((c) => c.isActive !== false));
    } catch {
      setCustomers([]);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  const createProject = async () => {
    if (startDate && targetDate && targetDate < startDate) {
      customToast.error({
        title: "",
        description: "End date must be on or after the start date.",
      });
      return;
    }

    setIsCreating(true);
    let shouldClose = true;
    try {
      await axios.post("/api/workflow/createproject", {
        projTitle: projTitle,
        projDescription: projDescription,
        projContent: projContent,
        createdBy: session?.user.id,
        priority: priority,
        status: status,
        serviceLine,
        customerId: customerId ?? undefined,
        startDate: startDate || undefined,
        targetDate: targetDate || undefined,
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
    <WorkflowModal maxWidth="max-w-3xl" onClose={() => setClose(false)}>
      <WorkflowModalHeader onClose={() => setClose(false)}>
        <div className="flex items-center gap-2 min-w-0 text-sm">
          <span className="shrink-0 rounded-md border border-(--border) bg-(--surface-2) px-2 py-1 text-xs font-semibold text-(--muted)">
            Team
          </span>
          <SVGIcon className="flex shrink-0 w-3" svgString={RAW_ICONS.ArrowRight} />
          <span className="font-semibold text-(--foreground) truncate">New project</span>
        </div>
      </WorkflowModalHeader>

      <WorkflowModalBody>
        <div className="space-y-3 min-w-0">
          <input
            className="ef-field text-xl sm:text-2xl font-semibold px-3 py-2 outline-none min-w-0"
            placeholder="Project name"
            value={projTitle}
            onChange={(e) => setProjTitle(e.target.value)}
          />
          <input
            className="ef-field text-sm px-3 py-2 outline-none min-w-0"
            placeholder="Short description"
            value={projDescription}
            onChange={(e) => setProjDescription(e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="new-project-service-line"
            className="block text-xs font-semibold uppercase tracking-wide text-(--muted) mb-2"
          >
            Service line <span className="text-red-600">*</span>
          </label>
          <ServiceLineSelect
            id="new-project-service-line"
            value={serviceLine}
            onChange={setServiceLine}
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--muted) mb-2">
            Customer <span className="text-red-600">*</span>
          </p>
          <CustomerPicker
            customers={customers}
            value={customerId}
            onChange={setCustomerId}
            onReload={loadCustomers}
            required
          />
        </div>

        <div className="min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EnterpriseDatePicker
            label="Start date"
            value={startDate}
            onChange={setStartDate}
          />
          <EnterpriseDatePicker
            label="End date"
            value={targetDate}
            onChange={setTargetDate}
          />
        </div>

        <div className="relative z-0 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--muted) mb-2">
            Properties
          </p>
          <div className="flex flex-wrap gap-2" ref={dropdownRef}>
            <button
              type="button"
              onClick={() =>
                setShowOptionsDropdown(showOptionsDropdown === "health" ? false : "health")
              }
              className="ef-pill"
            >
              {status}
            </button>
            {showOptionsDropdown === "health" && (
              <div className="absolute left-0 top-full z-30 mt-1 w-40 max-w-full rounded-md border border-(--border-strong) bg-(--surface-1) shadow-lg py-1">
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-(--foreground) hover:bg-(--surface-3)"
                    onClick={() => {
                      setStatus(option as ProjectStatusType);
                      setShowOptionsDropdown(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                setShowOptionsDropdown(showOptionsDropdown === "priority" ? false : "priority")
              }
              className="ef-pill"
            >
              {priority}
            </button>
            {showOptionsDropdown === "priority" && (
              <div className="absolute left-0 top-full z-30 mt-1 w-40 max-w-full rounded-md border border-(--border-strong) bg-(--surface-1) shadow-lg py-1">
                {priorityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-(--foreground) hover:bg-(--surface-3)"
                    onClick={() => {
                      setPriority(option as ProjectPriorityType);
                      setShowOptionsDropdown(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            {(["lead", "members"] as const).map((label) => (
              <span
                key={label}
                className="ef-pill opacity-60 cursor-not-allowed"
                title="Coming soon"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--muted) mb-2">
            Brief
          </p>
          <textarea
            className="ef-field text-sm px-3 py-2 outline-none min-h-[120px] resize-y w-full min-w-0"
            placeholder="Add project brief, long description, collect ideas and resources…"
            value={projContent}
            onChange={(e) => setProjContent(e.target.value)}
          />
        </div>
      </WorkflowModalBody>

      <WorkflowModalFooter>
        <button type="button" onClick={() => setClose(false)} className="ef-btn-outline h-9 px-4 rounded-md text-sm font-medium">
          Cancel
        </button>
        <button
          type="button"
          onClick={createProject}
          disabled={
            isCreating ||
            !projTitle.trim() ||
            serviceLine === null ||
            !customerId
          }
          className="ef-btn-primary h-9 min-w-[5.5rem] flex items-center justify-center rounded-md text-sm font-medium disabled:opacity-40 disabled:pointer-events-none"
        >
          {isCreating ? <SVGIcon svgString={RAW_ICONS.WhiteLoader} /> : "Create"}
        </button>
      </WorkflowModalFooter>
    </WorkflowModal>
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
    <WorkflowModal maxWidth="max-w-md" onClose={() => closeDeleteWindow(false)}>
      <WorkflowModalHeader onClose={() => closeDeleteWindow(false)}>
        <p className="font-semibold text-lg text-(--foreground)">Delete project?</p>
      </WorkflowModalHeader>
      <WorkflowModalBody>
        <p className="text-sm text-(--muted) leading-relaxed">
          Deleting this project will permanently remove all tickets and related data under it.
          This cannot be undone.
        </p>
      </WorkflowModalBody>
      <WorkflowModalFooter>
        <button
          type="button"
          onClick={() => closeDeleteWindow(false)}
          className="ef-btn-outline h-9 px-4 rounded-md text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={deleteProject}
          disabled={isDeleting}
          className="h-9 min-w-[5rem] px-4 rounded-md border border-red-400 bg-red-50 text-red-700 font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {isDeleting ? <SVGIcon svgString={RAW_ICONS.RedDeleteLoader} /> : "Delete"}
        </button>
      </WorkflowModalFooter>
    </WorkflowModal>
  );
};
