"use client";

import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import { IssueBody, ProjectBody } from "@/utils/types";
import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import IssueLabel from "@/components/workflow/issues/issue-label";
import { IssueViewOptArray } from "@/utils/issues-view-options";
import { CreateIssueWindow } from "@/components/workflow/issues/create-issue-window";
import IssuesTopTile from "@/components/workflow/issues/issues-top-tile";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { customToast } from "@/lib/custom-toast";
import { ProjectNavbar } from "@/components/workflow/project-navbar";
import { useProjectRole } from "@/hooks/use-project-role";
import { useSession } from "next-auth/react";
import { TICKET_TYPE_OPTIONS } from "@/lib/ticket-type-labels";
import { TicketType, Role } from "@prisma/client";



type AiDraftPayload = {
  title?: string;
  description?: string;
  labels?: string[];
  severityHint?: string;
  acceptanceCriteria?: string[];
  priority?: string;
  status?: string;
} | null;

type AiTriagePayload = {
  priority?: string;
  severity?: string;
  routingTeamHint?: string;
  effortHint?: string;
  risk?: string;
  rationale?: string;
} | null;

export default function Issue() {
  const routeParams = useParams<{ projectId: string }>();
  const router = useRouter();
  const [project_id, setProjectId] = useState<string | null>("");
  const [project, setProject] = useState<ProjectBody | null>(null);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const [issues, setIssues] = useState<IssueBody[]>();
  const [isLoading, setIsLoading] = useState(true);

  const [createIssueWindowOpen, setCreateIssueWindowOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketTypeFilter, setTicketTypeFilter] = useState<"" | TicketType>("");
  const [matchingIssueIds, setMatchingIssueIds] = useState<string[] | null>(null);
  const [isSavingView, setIsSavingView] = useState(false);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState(0);
  const [aiInput, setAiInput] = useState("");
  const [aiDraft, setAiDraft] = useState<AiDraftPayload>(null);
  const [aiTriage, setAiTriage] = useState<AiTriagePayload>(null);
  const [aiDuplicates, setAiDuplicates] = useState<Array<{
    id: string;
    title: string;
    status?: string | null;
    priority?: string | null;
    score: number;
  }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const searchParams = useSearchParams();
  const latestSearchRequest = useRef(0);
  const { can: canProject, loading: roleLoading, role } = useProjectRole(project_id);
  const { status: sessionStatus } = useSession();
  const actionsReady = sessionStatus === "authenticated" && !roleLoading;
  const showExport =
    actionsReady && (canProject("exportTickets") || role === Role.ADMIN);
  const showCreate =
    actionsReady && (canProject("createTicket") || role === Role.ADMIN);

  const filteredIssues = useMemo(
    () =>
      (issues ?? []).filter((issue) => {
        const statusMatch = statusFilter
          ? issue.status?.toLowerCase() === statusFilter.toLowerCase()
          : true;
        const priorityMatch = priorityFilter
          ? issue.priority?.toLowerCase() === priorityFilter.toLowerCase()
          : true;
        const assigneeMatch = assigneeFilter
          ? (assigneeFilter === "unassigned" ? !issue.assignedUser : issue.assignedUser === assigneeFilter)
          : true;
        const searchMatch = matchingIssueIds ? matchingIssueIds.includes(issue.id) : true;
        return statusMatch && priorityMatch && assigneeMatch && searchMatch;
      }),
    [issues, statusFilter, priorityFilter, assigneeFilter, matchingIssueIds],
  );

  const selectionScopeKey = `${ticketTypeFilter}|${statusFilter}|${searchQuery}|${
    matchingIssueIds === null ? "null" : matchingIssueIds.join(",")
  }`;
  const prevSelectionScopeKey = useRef(selectionScopeKey);

  useEffect(() => {
    const scopeChanged = prevSelectionScopeKey.current !== selectionScopeKey;
    prevSelectionScopeKey.current = selectionScopeKey;
    setSelectedIssueIndex((prev) => {
      if (!filteredIssues.length) return 0;
      if (scopeChanged) return 0;
      return Math.min(prev, filteredIssues.length - 1);
    });
  }, [selectionScopeKey, filteredIssues]);

  useEffect(() => {
    const fetchIssues = async () => {
      if (!project_id) return;

      try {
        setIsLoading(true);
        const response = await axios.post("/api/issues/getissues", {
          project_id: project_id,
          ...(ticketTypeFilter ? { ticketType: ticketTypeFilter } : {}),
        });

        setIssues(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIssues();
  }, [project_id, ticketTypeFilter]);

  useEffect(() => {
    const fetchUniqueProject = async () => {
      if (!project_id) return;

      try {
        const response = await axios.post("/api/workflow/project", {
          project_id: project_id,
        });

        setProject(response.data);
      } catch (error) {
        console.log(error);
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
    const tt = searchParams.get("ticketType");
    if (tt && Object.values(TicketType).includes(tt as TicketType)) {
      setTicketTypeFilter(tt as TicketType);
    } else {
      setTicketTypeFilter("");
    }
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

  const hydrateAiInputFromSelection = () => {
    const selected = filteredIssues[selectedIssueIndex];
    if (!selected) return;
    setAiInput(`${selected.title}\n\n${selected.description ?? ""}`.trim());
  };

  const runAiDrafting = async () => {
    if (!project_id || !aiInput.trim()) return;
    try {
      setAiLoading(true);
      const draftRes = await axios.post("/api/ai/draft", { text: aiInput });
      const draft = draftRes.data?.draft ?? null;
      setAiDraft(draft);

      const triageRes = await axios.post("/api/ai/triage", {
        title: draft?.title ?? aiInput.slice(0, 80),
        description: draft?.description ?? aiInput,
        labels: draft?.labels ?? [],
      });
      setAiTriage(triageRes.data?.suggestions ?? null);

      const duplicateRes = await axios.post("/api/ai/duplicate-check", {
        projectId: project_id,
        title: draft?.title ?? aiInput.slice(0, 80),
        description: draft?.description ?? aiInput,
      });
      setAiDuplicates(duplicateRes.data?.duplicates ?? []);
    } catch {
      customToast.error({ title: "", description: "AI drafting failed." });
    } finally {
      setAiLoading(false);
    }
  };

  const createIssueFromDraft = async () => {
    if (!project_id || !aiDraft?.title) return;
    try {
      await axios.post("/api/issues/createissue", {
        issueTitle: aiDraft.title,
        issueDescription: [
          aiDraft.description ?? "",
          Array.isArray(aiDraft.acceptanceCriteria) && aiDraft.acceptanceCriteria.length
            ? `\n\nAcceptance criteria:\n${aiDraft.acceptanceCriteria
                .map((criterion) => `- ${criterion}`)
                .join("\n")}`
            : "",
        ].join(""),
        issueStatus: aiDraft.status ?? "Backlog",
        issuePriority: aiTriage?.priority ?? aiDraft.priority ?? "Medium",
        projectId: project_id,
        labels: Array.isArray(aiDraft?.labels) ? aiDraft.labels : [],
      });
      customToast.success({ title: "", description: "Issue created from AI draft." });
      setAiInput("");
      setAiDraft(null);
      setAiTriage(null);
      setAiDuplicates([]);
      const response = await axios.post("/api/issues/getissues", { project_id });
      setIssues(response.data);
    } catch (error) {
      const description = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Could not create issue from draft."
        : "Could not create issue from draft.";
      customToast.error({ title: "", description });
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!filteredIssues.length) return;
      const active =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const el = active ?? target;
      const inFormField = Boolean(
        el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT" ||
            el.isContentEditable ||
            el.closest("[contenteditable='true']")),
      );
      const onOtherInteractive = Boolean(
        el?.closest(
          "button, a[href], select, option, [role='button'], [role='link'], [role='menuitem'], [role='tab'], [role='combobox'], [role='listbox'], [role='switch']",
        ),
      );
      if (inFormField || onOtherInteractive) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        setSelectedIssueIndex((prev) => Math.min(prev + 1, filteredIssues.length - 1));
      }
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSelectedIssueIndex((prev) => Math.max(prev - 1, 0));
      }
      if (event.key === "Enter") {
        const issue = filteredIssues[selectedIssueIndex];
        if (issue?.id && project_id) {
          event.preventDefault();
          router.push(`/workflow/project/${project_id}/incident-tickets/${issue.id}`);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredIssues, project_id, router, selectedIssueIndex]);

  return (
    <>
      <WorkflowLayout windowSvg={RAW_ICONS.Issue} windowTitle="Tickets">
        <div className="flex flex-col flex-1 min-h-0">
        <ProjectNavbar projectId={project_id} projectTitle={project?.title} />
        <div className="border-b border-(--border) h-10 flex items-center justify-end px-4 bg-(--surface-2) gap-2">
          <button
            type="button"
            onClick={saveCurrentView}
            disabled={isSavingView}
            className="ef-btn-outline h-7 px-3 rounded-md text-xs font-medium text-(--foreground) disabled:opacity-50"
          >
            {isSavingView ? "Saving…" : "Save view"}
          </button>
          {roleLoading && sessionStatus === "authenticated" ? (
            <span className="text-xs text-(--muted-2) px-2">Loading permissions…</span>
          ) : null}
          {showExport ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (!project_id) return;
                  const params = new URLSearchParams({
                    projectId: project_id,
                    format: "csv",
                  });
                  if (ticketTypeFilter) params.set("ticketType", ticketTypeFilter);
                  if (searchQuery.trim()) params.set("search", searchQuery.trim());
                  window.location.href = `/api/issues/export?${params.toString()}`;
                }}
                className="ef-btn-outline h-7 px-3 rounded-md text-xs font-medium text-(--foreground)"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!project_id) return;
                  const params = new URLSearchParams({
                    projectId: project_id,
                    format: "xlsx",
                  });
                  if (ticketTypeFilter) params.set("ticketType", ticketTypeFilter);
                  if (searchQuery.trim()) params.set("search", searchQuery.trim());
                  window.location.href = `/api/issues/export?${params.toString()}`;
                }}
                className="ef-btn-outline h-7 px-3 rounded-md text-xs font-medium text-(--foreground)"
              >
                Export Excel
              </button>
            </>
          ) : null}
          {showCreate ? (
            <button
              type="button"
              onClick={() => setCreateIssueWindowOpen(true)}
              className="ef-icon-btn-primary gap-1.5 px-2.5 text-xs font-medium"
              aria-label="New ticket"
            >
              <SVGIcon className="w-4 h-4" svgString={RAW_ICONS.Add} />
              <span className="hidden sm:inline">New ticket</span>
            </button>
          ) : null}
          <button
            type="button"
            className="ef-icon-btn w-8 px-0"
            aria-label="Toggle sidebar"
            title="Panel layout"
          >
            <SVGIcon className="w-4 h-4" svgString={RAW_ICONS.SideBar} />
          </button>
        </div>

        <div
          className="
    h-10 border-b border-(--border) flex items-center px-2 gap-x-2
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

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-7 rounded-md border border-(--border-strong) bg-(--surface-1) px-2 text-xs text-(--foreground) outline-none cursor-pointer"
          >
            <option value="">All priorities</option>
            <option value="Critical">Critical</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="No Priority">No Priority</option>
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-7 rounded-md border border-(--border-strong) bg-(--surface-1) px-2 text-xs text-(--foreground) outline-none cursor-pointer"
          >
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {(() => {
              const uniqueAssignees = new Map<string, string>();
              (issues ?? []).forEach((issue) => {
                if (issue.assignedUser && issue.User) {
                  uniqueAssignees.set(issue.assignedUser, issue.User.name || issue.User.email || issue.assignedUser);
                }
              });
              return Array.from(uniqueAssignees.entries()).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ));
            })()}
          </select>

          {/* Active filters badge */}
          {(statusFilter || priorityFilter || assigneeFilter || ticketTypeFilter) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setPriorityFilter("");
                setAssigneeFilter("");
                setTicketTypeFilter("");
              }}
              className="h-7 px-2 rounded-md border border-red-300 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="px-2 py-2 border-b border-(--border) bg-(--surface-2) flex flex-wrap gap-2 items-center">
          <span className="text-xs text-(--muted-2) mr-1">Type:</span>
          {(
            [
              { id: "" as const, label: "All types" },
              ...TICKET_TYPE_OPTIONS.map((opt) => ({
                id: opt.value,
                label: opt.label,
              })),
            ] as const
          ).map((opt) => (
            <button
              key={opt.id || "all"}
              type="button"
              onClick={() => setTicketTypeFilter(opt.id)}
              className={`h-7 px-2 rounded-md border text-xs transition-colors ${
                ticketTypeFilter === opt.id
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-(--foreground)"
                  : "border-(--border) bg-(--surface-1) text-(--muted) hover:bg-(--surface-3)"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="px-2 py-2 border-b border-(--border) bg-(--surface-1)">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search incident & change tickets in this project  •  Use J/K + Enter"
            className="w-full h-8 rounded-md border border-(--border) bg-(--surface-2) px-2 text-sm"
          />
        </div>

        <div className="px-3 py-3 border-b border-(--border) bg-(--surface-1) space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">AI triage cockpit</p>
              <p className="text-xs text-(--muted-2)">
                Draft issues, score duplicates, and get routing suggestions before creating work.
              </p>
            </div>
            <button
              onClick={hydrateAiInputFromSelection}
              disabled={!filteredIssues[selectedIssueIndex]}
            className="ef-btn-outline h-7 px-2 rounded-md text-xs font-medium disabled:opacity-50"
          >
            Use selected
          </button>
          </div>
          <div className="flex gap-2">
            <textarea
              value={aiInput}
              onChange={(event) => setAiInput(event.target.value)}
              placeholder="Paste rough notes, a bug report, customer feedback, or a PRD fragment..."
              rows={2}
              className="min-h-16 flex-1 resize-none rounded-md border border-(--border) bg-(--surface-2) px-2 py-2 text-sm"
            />
            <button
              onClick={runAiDrafting}
              disabled={aiLoading || !aiInput.trim()}
              className="h-16 px-3 rounded-md border border-sky-400 bg-sky-100 text-sky-800 text-xs font-medium hover:bg-sky-200 disabled:opacity-50 transition-colors"
            >
              {aiLoading ? "Thinking…" : "Draft with AI"}
            </button>
          </div>
          {(aiDraft || aiTriage || aiDuplicates.length > 0) && (
            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr_1fr] gap-2 text-xs">
              <div className="rounded-md border border-(--border) bg-(--surface-2) p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-(--muted-2)">Draft</p>
                    <p className="text-sm font-medium">{aiDraft?.title ?? "Untitled draft"}</p>
                  </div>
                  <span className="rounded border border-(--border) bg-(--surface-1) px-2 py-1">
                    {aiDraft?.status ?? "Backlog"}
                  </span>
                </div>
                {aiDraft?.description ? (
                  <p className="line-clamp-3 text-(--muted-2)">{aiDraft.description}</p>
                ) : null}
                {Array.isArray(aiDraft?.acceptanceCriteria) && aiDraft.acceptanceCriteria.length ? (
                  <ul className="space-y-1 text-(--muted-2)">
                    {aiDraft.acceptanceCriteria.slice(0, 4).map((criterion) => (
                      <li key={criterion}>- {criterion}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {(aiDraft?.labels ?? []).map((label) => (
                    <span key={label} className="rounded border border-(--border) px-2 py-0.5">
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-(--border) bg-(--surface-2) p-3 space-y-2">
                <p className="text-(--muted-2)">Triage suggestion</p>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Priority" value={aiTriage?.priority ?? aiDraft?.priority ?? "Medium"} />
                  <Metric label="Severity" value={aiTriage?.severity ?? aiDraft?.severityHint ?? "Medium"} />
                  <Metric label="Effort" value={aiTriage?.effortHint ?? "M"} />
                  <Metric label="Route" value={aiTriage?.routingTeamHint ?? "Engineering"} />
                </div>
                {aiTriage?.risk ? <p className="text-(--muted-2)">Risk: {aiTriage.risk}</p> : null}
                {aiTriage?.rationale ? <p className="text-(--muted-2)">{aiTriage.rationale}</p> : null}
                <button
                  onClick={createIssueFromDraft}
                  className="h-8 px-2 rounded-md border border-(--border-strong) bg-(--surface-3)"
                >
                  Create issue from draft
                </button>
              </div>

              <div className="rounded-md border border-(--border) bg-(--surface-2) p-3 space-y-2">
                <p className="text-(--muted-2)">Duplicate check</p>
                {aiDuplicates.length > 0 ? (
                  aiDuplicates.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      href={`/workflow/project/${project_id}/incident-tickets/${item.id}`}
                      className="block rounded border border-(--border) bg-(--surface-1) px-2 py-1 hover:bg-(--surface-3)"
                    >
                      <p className="truncate">{item.title}</p>
                      <p className="text-(--muted-2)">
                        {Math.round(item.score * 100)}% match · {item.status ?? "No status"}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-(--muted-2)">No strong duplicates found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <IssuesTopTile />

        {isLoading ? (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pt-1 space-y-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 border-b border-(--border) flex items-center px-4 gap-4 animate-pulse">
                <div className="w-4 h-4 rounded bg-(--surface-3) shrink-0" />
                <div className="h-3 bg-(--surface-3) rounded w-1/3" />
                <div className="h-3 bg-(--surface-3) rounded w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pt-1 ">
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
                    ticketType={elem.ticketType}
                    ticketNumber={elem.ticketNumber}
                    globalTicketNumber={elem.globalTicketNumber}
                    dueDate={elem.dueDate}
                    issueStatus={elem.status}
                    updatedAt={elem.updatedAt}
                    assigneeInfo={elem.User}
                    selected={selectedIssueIndex === key}
                  />
                );
              })
            ) : (
              <div className="h-10 flex items-center w-full justify-center">
                <p className="text-(--muted-2)">No tickets found</p>
              </div>
            )}
          </div>
        )}
        </div>
      </WorkflowLayout>

      {createIssueWindowOpen && (
        <CreateIssueWindow
          setClose={setCreateIssueWindowOpen}
          project_id={project_id}
          project_title={project?.title}
          onCreated={async () => {
            if (!project_id) return;
            const response = await axios.post("/api/issues/getissues", { project_id });
            setIssues(response.data);
          }}
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
  const isAll = title.toLowerCase() === "all issues";
  const isActive = isAll ? filter === "" : filter === title;
  return (
    <button
      onClick={isAll ? () => setFilter("") : () => setFilter(title)}
      className={
        (isActive
          ? "bg-sky-100 border-sky-400 text-sky-900 font-medium "
          : "text-(--foreground) ") +
        "flex items-center gap-x-1 border border-(--border-strong) h-7 px-2 rounded-md text-sm hover:bg-(--surface-3) transition-all duration-300 min-w-[90px] shrink-0 bg-(--surface-1)"
      }
    >
      <SVGIcon className="flex w-4" svgString={svg} />
      <p className="truncate">{title}</p>
    </button>
  );
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-(--border) bg-(--surface-1) px-2 py-1">
      <p className="text-[11px] text-(--muted-2)">{label}</p>
      <p className="truncate">{value}</p>
    </div>
  );
}
