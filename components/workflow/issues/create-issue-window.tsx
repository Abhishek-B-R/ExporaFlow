"use client";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import axios from "axios";
import { useRef, useState, useEffect } from "react";
import { TicketType, TicketUrgency } from "@prisma/client";
import { useSession } from "next-auth/react";
import { URGENCY_OPTIONS } from "@/lib/ticket-due-date-policy";
import { isChangeManagementType } from "@/lib/ticket-types";
import { TICKET_TYPE_OPTIONS } from "@/lib/ticket-type-labels";
import { statusesForTicketType } from "@/lib/issue-status-machine";
import { EnterpriseDatePicker } from "@/components/workflow/enterprise-date-picker";
import { renderPrioritySvg, RenderStatusSvg } from "./issue-label";
import { PriorityOptionsArray } from "@/utils/issues-view-options";
import { customToast } from "@/lib/custom-toast";
import {
  WorkflowModal,
  WorkflowModalBody,
  WorkflowModalFooter,
  WorkflowModalHeader,
} from "@/components/workflow/workflow-modal";

type DuplicateCandidate = {
  id: string;
  title: string;
  status?: string | null;
  score: number;
};

type ProjectMember = {
  id: string;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export const CreateIssueWindow = ({
  setClose,
  project_id,
  project_title,
  onCreated,
}: {
  setClose: React.Dispatch<React.SetStateAction<boolean>>;
  project_id: string | null;
  project_title: string | undefined;
  onCreated?: () => void | Promise<void>;
}) => {
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [selectedPriorityOption, setSelectedPriorityOption] =
    useState("No Priority");
  const [selectedStatusOption, setSelectedStatusOption] = useState("Working");
  const [showOptionsDropdown, setShowOptionsDropdown] = useState<
    "status" | "priority" | "assignee" | false
  >(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [assignedUserId, setAssignedUserId] = useState("");

  const [isDrafting, setIsDrafting] = useState(false);
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageSuggestion, setTriageSuggestion] = useState<{
    priority: string;
    severity: string;
    routingTeamHint: string;
    effortHint: string;
    risk: string;
    rationale: string;
  } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCandidate | null>(null);

  const [ticketType, setTicketType] = useState<TicketType>(TicketType.INCIDENT);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [urgency, setUrgency] = useState<TicketUrgency>(TicketUrgency.MEDIUM);
  const [requesterName, setRequesterName] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    if (requesterName.trim()) return;
    const label =
      session?.user?.name?.trim() ||
      session?.user?.email?.split("@")[0] ||
      "";
    if (label) setRequesterName(label);
  }, [session, requesterName]);

  useEffect(() => {
    const allowed = statusesForTicketType(ticketType);
    setSelectedStatusOption((prev) =>
      allowed.includes(prev) ? prev : (allowed[0] ?? "Backlog"),
    );
  }, [ticketType]);

  useEffect(() => {
    if (!project_id) return;
    const loadMembers = async () => {
      try {
        const res = await axios.get<ProjectMember[]>("/api/workflow/getmembers", {
          params: { projectId: project_id },
        });
        let list = res.data ?? [];
        if (list.length === 0) {
          const wsRes = await axios.get<ProjectMember[]>("/api/workflow/getmembers");
          list = wsRes.data ?? [];
        }
        setMembers(list);
      } catch {
        setMembers([]);
      }
    };
    loadMembers();
  }, [project_id]);

  useEffect(() => {
    if (!showOptionsDropdown) return;
    const onPointerDown = (e: MouseEvent) => {
      if (actionsRef.current?.contains(e.target as Node)) return;
      setShowOptionsDropdown(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showOptionsDropdown]);

  const createIssue = async () => {
    try {
      const response = await axios.post("/api/issues/createissue", {
        issueTitle: issueTitle,
        issueDescription: issueDescription,
        issueStatus: selectedStatusOption,
        issuePriority: selectedPriorityOption,
        projectId: project_id,
        ticketType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        durationMinutes: durationMinutes
          ? Number.parseInt(durationMinutes, 10)
          : undefined,
        assignedUser: assignedUserId || null,
        urgency,
        requesterName: requesterName.trim() || undefined,
      });

      if (response.data) {
        customToast.success({
          title: "Success",
          description: "Ticket created successfully",
        });
        await onCreated?.();
        setClose(false);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const dup = error.response.data?.duplicate;
        if (dup) {
          setDuplicateWarning({
            id: dup.id,
            title: dup.title,
            status: dup.status,
            score: dup.score ?? 1,
          });
          return;
        }
      }
      const description = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Failed to create issue, try again."
        : "Failed to create issue, try again.";
      customToast.error({
        title: "Action failed",
        description,
      });
    }
  };

  const aiDraft = async () => {
    const rawText = `${issueTitle}\n${issueDescription}`.trim();
    if (!rawText) {
      customToast.error({ title: "", description: "Type something first so AI can draft an issue." });
      return;
    }
    try {
      setIsDrafting(true);
      const res = await axios.post("/api/ai/draft", { text: rawText });
      const draft = res.data?.draft;
      if (draft) {
        setIssueTitle(draft.title ?? issueTitle);
        setIssueDescription(draft.description ?? issueDescription);
        if (draft.priority && draft.priority !== "No Priority") {
          setSelectedPriorityOption(draft.priority);
        }
        if (draft.status) {
          setSelectedStatusOption(draft.status);
        }
        customToast.success({ title: "AI Draft", description: "Issue drafted by AI. Review and edit before creating." });
      }
    } catch {
      customToast.error({ title: "", description: "AI drafting failed." });
    } finally {
      setIsDrafting(false);
    }
  };

  const aiTriage = async () => {
    if (!issueTitle.trim()) {
      customToast.error({ title: "", description: "Add a title first for AI triage." });
      return;
    }
    try {
      setIsTriaging(true);
      const res = await axios.post("/api/ai/triage", {
        title: issueTitle,
        description: issueDescription,
      });
      const suggestions = res.data?.suggestions;
      if (suggestions) {
        setTriageSuggestion(suggestions);
      }
    } catch {
      customToast.error({ title: "", description: "AI triage failed." });
    } finally {
      setIsTriaging(false);
    }
  };

  const applyTriageSuggestion = () => {
    if (!triageSuggestion) return;
    setSelectedPriorityOption(triageSuggestion.priority);
    setTriageSuggestion(null);
    customToast.success({ title: "", description: "Applied AI triage suggestion." });
  };

  const handlePriorityOptionClick = async (option: string) => {
    setSelectedPriorityOption(option);
    setShowOptionsDropdown(false);
  };

  const handleStatusOptionClick = async (option: string) => {
    setSelectedStatusOption(option);
    setShowOptionsDropdown(false);
  };

  const assigneeMember = members.find((m) => m.user.id === assignedUserId);
  const assigneeLabel =
    assigneeMember?.user.name ||
    assigneeMember?.user.email?.split("@")[0] ||
    null;

  const toggleDropdown = (key: "priority" | "status" | "assignee") => {
    setShowOptionsDropdown((current) => (current === key ? false : key));
  };

  return (
    <WorkflowModal maxWidth="max-w-3xl" onClose={() => setClose(false)}>
      <WorkflowModalHeader onClose={() => setClose(false)}>
        <div className="flex items-center gap-2 min-w-0 text-sm">
          <span className="shrink-0 rounded-md border border-(--border) bg-(--surface-2) px-2 py-1 text-xs font-semibold text-(--muted)">
            {project_title?.toUpperCase().slice(0, 3) ?? "PRJ"}
          </span>
          <SVGIcon className="flex shrink-0 w-3" svgString={RAW_ICONS.ArrowRight} />
          <span className="font-semibold text-(--foreground) truncate">New ticket</span>
        </div>
      </WorkflowModalHeader>

      <WorkflowModalBody>
        <input
          className="ef-field text-2xl font-semibold px-3 py-2 outline-none min-w-0"
          onChange={(e) => {
            setIssueTitle(e.target.value);
            setDuplicateWarning(null);
          }}
          placeholder="Ticket title"
          value={issueTitle}
        />
        <textarea
          className="ef-field w-full text-base px-3 py-2 outline-none resize-y min-h-[120px] min-w-0"
          onChange={(e) => {
            setIssueDescription(e.target.value);
          }}
          placeholder="Ticket description"
          name="description"
          value={issueDescription}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-(--muted)">Requester</label>
            <input
              className="ef-field text-sm px-3 py-2 outline-none min-w-0"
              placeholder="Who is reporting this?"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-(--muted)">Urgency</label>
            <select
              className="ef-field text-sm px-3 py-2 outline-none min-w-0"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
            >
              {URGENCY_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs text-(--muted) uppercase tracking-wide font-medium">Ticket type</p>
          <div className="flex flex-wrap gap-2">
            {TICKET_TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTicketType(value)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  ticketType === value ? "ef-chip-active" : "ef-chip"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {isChangeManagementType(ticketType) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <EnterpriseDatePicker
                label="Start date *"
                value={startDate}
                onChange={setStartDate}
              />
              <EnterpriseDatePicker
                label="End date"
                value={endDate}
                onChange={setEndDate}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-(--muted)">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  className="h-10 rounded-md border border-(--border-strong) bg-(--surface-2) px-3 text-sm text-(--foreground)"
                  placeholder="If no end date"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>

        {duplicateWarning && (
          <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm">
            <p className="font-medium text-red-700">Possible duplicate detected</p>
            <p className="text-(--muted) mt-1">
              &quot;{duplicateWarning.title}&quot; ({duplicateWarning.status ?? "Open"}) — {Math.round(duplicateWarning.score * 100)}% match
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-100"
              >
                Create anyway
              </button>
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarning(null);
                  setClose(false);
                }}
                className="text-xs px-2 py-1 rounded ef-control"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {triageSuggestion && (
          <div className="mt-3 rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sky-800">AI Triage Suggestion</p>
              <button
                type="button"
                onClick={() => setTriageSuggestion(null)}
                className="text-xs text-(--muted-2) hover:text-sky-800"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs text-(--foreground)">
              <div>
                <span className="text-(--muted-2)">Priority:</span> {triageSuggestion.priority}
              </div>
              <div>
                <span className="text-(--muted-2)">Severity:</span> {triageSuggestion.severity}
              </div>
              <div>
                <span className="text-(--muted-2)">Effort:</span> {triageSuggestion.effortHint}
              </div>
              <div>
                <span className="text-(--muted-2)">Team:</span> {triageSuggestion.routingTeamHint}
              </div>
              <div className="col-span-2">
                <span className="text-(--muted-2)">Risk:</span> {triageSuggestion.risk}
              </div>
            </div>
            <p className="text-xs text-(--muted-2) mt-2">{triageSuggestion.rationale}</p>
            <button
              type="button"
              onClick={applyTriageSuggestion}
              className="mt-2 text-xs px-2 py-1 rounded border border-sky-400 bg-sky-100 hover:bg-sky-200 text-sky-800 font-medium"
            >
              Apply priority suggestion
            </button>
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--muted) mb-2">
            Actions
          </p>
          <div ref={actionsRef} className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="relative">
              <button
                type="button"
                className="flex ef-control items-center text-sm justify-center h-7 w-8 rounded-md cursor-pointer"
                onClick={() => toggleDropdown("priority")}
                aria-expanded={showOptionsDropdown === "priority"}
                aria-haspopup="listbox"
              >
                {renderPrioritySvg(selectedPriorityOption)}
              </button>
              {showOptionsDropdown === "priority" && (
                <div className="absolute w-36 top-full left-0 ef-dropdown-panel rounded-lg mt-1 z-[110] py-0.5">
                  {PriorityOptionsArray.map((option, key) => (
                    <button
                      key={key}
                      type="button"
                      className="w-full px-2 py-2 ef-dropdown-item flex items-center gap-x-2 text-sm text-left"
                      onClick={() => handlePriorityOptionClick(option.name)}
                    >
                      <SVGIcon className="flex w-4" svgString={option.svg} />
                      {option.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="flex ef-control items-center text-sm justify-center h-7 w-8 rounded-md cursor-pointer"
                onClick={() => toggleDropdown("status")}
                aria-expanded={showOptionsDropdown === "status"}
                aria-haspopup="listbox"
              >
                <RenderStatusSvg status={selectedStatusOption} />
              </button>
              {showOptionsDropdown === "status" && (
                <div className="absolute w-36 top-full left-0 ef-dropdown-panel rounded-lg mt-1 z-[110] py-0.5">
                  {statusesForTicketType(ticketType).map((optionTitle) => (
                    <button
                      key={optionTitle}
                      type="button"
                      className="w-full px-2 flex gap-x-2 items-center py-2 ef-dropdown-item text-sm text-left"
                      onClick={() => handleStatusOptionClick(optionTitle)}
                    >
                      <RenderStatusSvg status={optionTitle} />
                      {optionTitle}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="ef-control rounded-md text-sm px-2 h-7 max-w-[9rem] truncate"
                onClick={() => toggleDropdown("assignee")}
                aria-expanded={showOptionsDropdown === "assignee"}
                aria-haspopup="listbox"
              >
                {assigneeLabel ?? "Assignee"}
              </button>
              {showOptionsDropdown === "assignee" && (
                <div className="absolute left-0 top-full z-[110] mt-1 w-52 max-h-56 overflow-y-auto rounded-lg border border-(--border-strong) bg-(--surface-1) shadow-lg py-1">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-(--foreground) hover:bg-(--surface-3)"
                    onClick={() => {
                      setAssignedUserId("");
                      setShowOptionsDropdown(false);
                    }}
                  >
                    Unassigned
                  </button>
                  {members.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-(--muted-2)">
                      No project members found
                    </p>
                  ) : (
                    members.map((member) => {
                      const name =
                        member.user.name ||
                        member.user.email ||
                        "Team member";
                      const active = member.user.id === assignedUserId;
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                            active
                              ? "bg-sky-100 text-sky-900"
                              : "text-(--foreground) hover:bg-(--surface-3)"
                          }`}
                          onClick={() => {
                            setAssignedUserId(member.user.id);
                            setShowOptionsDropdown(false);
                          }}
                        >
                          {member.user.image ? (
                            <img
                              src={member.user.image}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span className="h-6 w-6 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-center shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="truncate">{name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={aiDraft}
              disabled={isDrafting}
              className="border border-sky-400 bg-sky-100 text-sky-800 rounded-md text-sm px-2 h-7 hover:bg-sky-200 font-medium transition-colors disabled:opacity-50"
            >
              {isDrafting ? "Drafting…" : "✨ AI Draft"}
            </button>
            <button
              type="button"
              onClick={aiTriage}
              disabled={isTriaging}
              className="border border-violet-400 bg-violet-100 text-violet-800 rounded-md text-sm px-2 h-7 hover:bg-violet-200 font-medium transition-colors disabled:opacity-50"
            >
              {isTriaging ? "Triaging…" : "⚡ AI Triage"}
            </button>
          </div>
        </div>
      </WorkflowModalBody>

      <WorkflowModalFooter>
        <button type="button" onClick={() => setClose(false)} className="ef-btn-outline h-9 px-4 rounded-md text-sm font-medium">
          Cancel
        </button>
        <button
          type="button"
          onClick={createIssue}
          className="ef-btn-primary h-9 px-4 rounded-md text-sm font-medium"
        >
          Create ticket
        </button>
      </WorkflowModalFooter>
    </WorkflowModal>
  );
};
