"use client";

import { customToast } from "@/lib/custom-toast";
import { IssueBody, SprintBody } from "@/utils/types";
import { PriorityOptionsArray } from "@/utils/issues-view-options";
import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RenderStatusSvg, renderPrioritySvg } from "@/components/workflow/issues/issue-label";
import { useRouter } from "next/navigation";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import { TicketType, TicketUrgency } from "@prisma/client";
import { formatTicketKey } from "@/lib/ticket-display";
import { URGENCY_OPTIONS } from "@/lib/ticket-due-date-policy";
import { isTicketOverdue, slaCountdownLabel } from "@/lib/sla-countdown";
import {
  ticketTypeBadgeClass,
  ticketTypeLabel,
} from "@/lib/ticket-type-labels";
import { statusesForTicketType } from "@/lib/issue-status-machine";
import { EnterpriseDatePicker } from "@/components/workflow/enterprise-date-picker";
import { MentionTextarea } from "@/components/workflow/mentions/mention-textarea";
import { IssueAttachmentsPanel } from "@/components/workflow/issues/issue-attachments-panel";
import { useProjectRole } from "@/hooks/use-project-role";
import { mentionHandleFromUser, type MentionSuggestion } from "@/lib/mention-utils";

type WorkspaceMember = {
  id: string;
  user: { id: string; name?: string; email?: string; image?: string; username?: string };
};

type StoreEmployee = {
  id: string;
  fullName: string;
  email: string;
  userId?: string | null;
  isActive?: boolean;
};

type IssueComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name?: string; email?: string; image?: string };
};

type IssueActivity = {
  id: string;
  action: string;
  field?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  createdAt: string;
  actor: { id: string; name?: string; email?: string };
};

type FullIssue = IssueBody & {
  ticketType?: TicketType;
  createdAt?: string;
  User?: { id: string; name?: string; email?: string; image?: string } | null;
  requesterUser?: { id: string; name?: string | null; email?: string | null } | null;
  parentIssue?: { id: string; title: string } | null;
  subtasks?: Array<{ id: string; title: string; status?: string }>;
  blockersFrom?: Array<{
    blockedIssue?: { id: string; title: string; status?: string } | null;
  }>;
  blockedBy?: Array<{
    blockerIssue?: { id: string; title: string; status?: string } | null;
  }>;
  comments?: IssueComment[];
  activities?: IssueActivity[];
};

export default function Issue({
  params,
}: {
  params: Promise<{ ticketId: string; projectId: string }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [issueId, setIssueId] = useState<string | null>(null);
  const [issue, setIssue] = useState<FullIssue | null>(null);
  const [sprints, setSprints] = useState<SprintBody[]>([]);
  const [issuesInProject, setIssuesInProject] = useState<IssueBody[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [employees, setEmployees] = useState<StoreEmployee[]>([]);
  const router = useRouter();
  const { can: canProject, loading: roleLoading } = useProjectRole(projectId);
  const canEditTicket = canProject("updateTicket");

  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [statusInput, setStatusInput] = useState("Backlog");
  const [priorityInput, setPriorityInput] = useState("No Priority");
  const [assignedUserInput, setAssignedUserInput] = useState("");
  const [parentIssueInput, setParentIssueInput] = useState("");
  const [labelsInput, setLabelsInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [urgencyInput, setUrgencyInput] = useState<TicketUrgency>(TicketUrgency.MEDIUM);
  const [requesterNameInput, setRequesterNameInput] = useState("");
  const [requesterEmailInput, setRequesterEmailInput] = useState("");
  const [sprintInput, setSprintInput] = useState("");
  const [estimateInput, setEstimateInput] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [activityTab, setActivityTab] = useState<"comments" | "activity">("comments");

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setIssueId(resolvedParams.ticketId);
      setProjectId(resolvedParams.projectId);
    };
    loadParams();
  }, [params]);

  const populateIssueForm = useCallback((issueData: FullIssue) => {
    setTitleInput(issueData.title ?? "");
    setDescriptionInput(issueData.description ?? "");
    setStatusInput(issueData.status ?? "Backlog");
    setPriorityInput(issueData.priority ?? "No Priority");
    setAssignedUserInput(issueData.assignedUser ?? "");
    setParentIssueInput(issueData.parentIssueId ?? "");
    setLabelsInput((issueData.labels ?? []).join(", "));
    setDueDateInput(
      issueData.dueDate ? new Date(issueData.dueDate).toISOString().slice(0, 10) : "",
    );
    setSprintInput(issueData.sprintId ?? "");
    setEstimateInput(issueData.estimate ?? null);
    setUrgencyInput(issueData.urgency ?? TicketUrgency.MEDIUM);
    setRequesterNameInput(issueData.requesterName ?? "");
    setRequesterEmailInput(
      issueData.requesterEmail ??
        issueData.requesterUser?.email ??
        "",
    );
  }, []);

  const fetchIssueData = useCallback(
    async (options?: { resetForm?: boolean }) => {
      if (!issueId || !projectId) return;
      const [issueRes, sprintRes, allIssuesRes, membersRes, employeesRes] =
        await Promise.all([
        axios.post("/api/issues/getissue", { issueId }),
        axios.post("/api/sprints/getsprints", { projectId }),
        axios.post("/api/issues/getissues", { project_id: projectId }),
        axios.get("/api/workflow/getmembers", { params: { projectId } }),
        axios.get("/api/employees?status=active").catch(() => ({ data: [] })),
      ]);

      const issueData = issueRes.data as FullIssue;
      setIssue(issueData);
      setSprints(sprintRes.data ?? []);
      setIssuesInProject(allIssuesRes.data ?? []);
      let memberList: WorkspaceMember[] = membersRes.data ?? [];
      if (memberList.length === 0) {
        const wsRes = await axios.get<WorkspaceMember[]>("/api/workflow/getmembers");
        memberList = wsRes.data ?? [];
      }
      setMembers(memberList);
      setEmployees(employeesRes.data ?? []);
      if (options?.resetForm ?? true) {
        populateIssueForm(issueData);
      }
    },
    [issueId, projectId, populateIssueForm],
  );

  useEffect(() => {
    if (!issueId || !projectId) return;
    fetchIssueData().catch(() => {
      customToast.error({ title: "", description: "Failed to fetch issue details." });
    });
  }, [issueId, projectId, fetchIssueData]);

  const saveField = async (field: string, value: unknown) => {
    if (!issueId) return;
    try {
      setIsSaving(true);
      await axios.patch("/api/issues/updateissue", { issueId, [field]: value });
      await fetchIssueData({ resetForm: true });
      customToast.success({ title: "", description: "Updated." });
    } catch {
      customToast.error({ title: "", description: "Failed to update." });
    } finally {
      setIsSaving(false);
    }
  };

  const saveIssueMeta = async () => {
    if (!issueId || !issue) return;
    try {
      setIsSaving(true);
      const labels = labelsInput
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);

      await axios.patch("/api/issues/updateissue", {
        issueId,
        issueTitle: titleInput.trim(),
        issueDescription: descriptionInput,
        issueStatus: statusInput,
        issuePriority: priorityInput,
        assignedUser: assignedUserInput || null,
        parentIssueId: parentIssueInput || null,
        sprintId: sprintInput || null,
        dueDate: dueDateInput || null,
        urgency: urgencyInput,
        requesterName: requesterNameInput.trim() || null,
        requesterEmail: requesterEmailInput.trim() || null,
        labels,
        estimate: estimateInput,
        manualDueDateOverride: Boolean(dueDateInput),
      });

      customToast.success({ title: "", description: "Issue details updated." });
      await fetchIssueData({ resetForm: true });
    } catch {
      customToast.error({ title: "", description: "Failed to update issue details." });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteIssue = async () => {
    if (!issueId || !projectId) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this issue? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await axios.delete("/api/issues/deleteissue", { data: { issueId } });
      customToast.success({ title: "", description: "Issue deleted successfully." });
      router.push(`/workflow/project/${projectId}/incident-tickets`);
    } catch {
      customToast.error({ title: "", description: "Failed to delete issue." });
      setIsDeleting(false);
    }
  };

  const addComment = async () => {
    if (!issueId || !commentInput.trim()) return;
    try {
      setIsPostingComment(true);
      await axios.post("/api/issues/comments", {
        issueId,
        body: commentInput,
      });
      setCommentInput("");
      await fetchIssueData({ resetForm: false });
    } catch {
      customToast.error({ title: "", description: "Failed to add comment." });
    } finally {
      setIsPostingComment(false);
    }
  };

  const mentionSuggestions = useMemo(() => {
    const byId = new Map<string, MentionSuggestion>();

    for (const member of members) {
      byId.set(member.user.id, {
        id: member.user.id,
        label: member.user.name || member.user.email || "Team member",
        handle: mentionHandleFromUser(member.user),
        email: member.user.email,
        image: member.user.image,
      });
    }

    for (const emp of employees.filter((e) => e.isActive !== false)) {
      const key = emp.userId ?? `emp:${emp.id}`;
      if (byId.has(key)) continue;
      byId.set(key, {
        id: key,
        label: emp.fullName,
        handle: mentionHandleFromUser({
          id: emp.id,
          name: emp.fullName,
          email: emp.email,
        }),
        email: emp.email,
      });
    }

    const issueUser = issue?.User;
    if (issueUser?.id && !byId.has(issueUser.id)) {
      byId.set(issueUser.id, {
        id: issueUser.id,
        label: issueUser.name || issueUser.email || "Reporter",
        handle: mentionHandleFromUser(issueUser),
        email: issueUser.email,
        image: issueUser.image,
      });
    }

    if (assignedUserInput) {
      const assignee = members.find((m) => m.user.id === assignedUserInput)?.user;
      if (assignee && !byId.has(assignee.id)) {
        byId.set(assignee.id, {
          id: assignee.id,
          label: assignee.name || assignee.email || "Assignee",
          handle: mentionHandleFromUser(assignee),
          email: assignee.email,
          image: assignee.image,
        });
      }
    }

    return Array.from(byId.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
  }, [members, employees, issue, assignedUserInput]);

  const assigneeMember = members.find((m) => m.user.id === assignedUserInput);
  const assigneeName = assigneeMember?.user.name || assigneeMember?.user.email || null;

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  // Loading skeleton
  if (!issue) {
    return (
      <div className="grow min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-(--muted-2)">Loading ticket…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grow min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="h-11 border-b border-(--border) bg-(--surface-1) flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          {projectId && (
            <Link
              href={`/workflow/project/${projectId}/incident-tickets`}
              className="text-sm text-(--muted-2) hover:text-(--foreground) transition-colors flex items-center gap-1"
            >
              <SVGIcon className="flex w-4" svgString={RAW_ICONS.ArrowLeft ?? RAW_ICONS.Close} />
              Back
            </Link>
          )}
          <span className="text-(--muted-2) text-xs">·</span>
          <p className="text-xs text-(--muted-2) font-mono font-semibold">
            {formatTicketKey({
              globalTicketNumber: issue.globalTicketNumber,
              ticketType: issue.ticketType,
              ticketNumber: issue.ticketNumber,
            }) ?? issue.id.slice(0, 8)}
          </p>
          {issue.ticketType ? (
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${ticketTypeBadgeClass(issue.ticketType)}`}
            >
              {ticketTypeLabel(issue.ticketType)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!roleLoading && canProject("deleteTicket") ? (
            <button
              onClick={deleteIssue}
              disabled={isDeleting || isSaving}
              className="h-7 px-3 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Delete ticket"}
            </button>
          ) : null}
          {!roleLoading && canProject("updateTicket") ? (
            <button
              onClick={saveIssueMeta}
              disabled={isSaving || isDeleting}
              className="h-7 px-3 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Main content — two-column layout */}
      <div className="grow flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        {/* Left — main content area */}
        <div className="grow md:overflow-y-auto px-4 sm:px-6 md:px-10 py-6 space-y-6 shrink-0">
          {/* Title */}
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            readOnly={!canEditTicket}
            className="w-full bg-transparent text-xl md:text-2xl font-semibold outline-none border-none placeholder:text-(--muted-2)"
            placeholder="Ticket title"
          />

          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`text-[10px] uppercase tracking-wide rounded px-2 py-0.5 border ${
                issue.ticketType === TicketType.CHANGE
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  : "border-sky-500/40 bg-sky-500/10 text-sky-100"
              }`}
            >
              {issue.ticketType === TicketType.CHANGE ? "Change management" : "Incident management"}
            </span>
            {issue.status === "Hold" && issue.ticketType === TicketType.CHANGE ? (
              <span className="text-[10px] uppercase tracking-wide rounded px-2 py-0.5 border border-orange-400/50 bg-orange-500/15 text-orange-100">
                On hold · SLA paused
              </span>
            ) : null}
          </div>

          {/* Description */}
          <textarea
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            rows={6}
            readOnly={!canEditTicket}
            className="w-full bg-transparent text-sm text-(--muted) outline-none border-none resize-none placeholder:text-(--muted-2) leading-relaxed"
            placeholder="Add a description… (supports markdown)"
          />

          {issueId ? (
            <IssueAttachmentsPanel
              issueId={issueId}
              canUpload={canProject("uploadAttachment")}
              canDelete={canProject("deleteAttachment")}
            />
          ) : null}

          {/* Sub-issues */}
          {(issue.subtasks ?? []).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-(--muted-2) uppercase tracking-wide">Sub-tickets</p>
              <div className="space-y-1">
                {issue.subtasks!.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/workflow/project/${projectId}/incident-tickets/${sub.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-(--border) bg-(--surface-2) hover:bg-(--surface-3) transition-colors text-sm"
                  >
                    <RenderStatusSvg status={sub.status ?? "Backlog"} />
                    <span>{sub.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Activity section */}
          <div className="space-y-3 pt-4 border-t border-(--border)">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActivityTab("comments")}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activityTab === "comments" ? "border-sky-500 text-sky-700" : "border-transparent text-(--muted-2) hover:text-(--foreground)"}`}
              >
                Comments ({(issue.comments ?? []).length})
              </button>
              <button
                onClick={() => setActivityTab("activity")}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activityTab === "activity" ? "border-sky-500 text-sky-700" : "border-transparent text-(--muted-2) hover:text-(--foreground)"}`}
              >
                Activity ({(issue.activities ?? []).length})
              </button>
            </div>

            {activityTab === "comments" && (
              <div className="space-y-3">
                {/* Comment input */}
                <div className="rounded-lg border border-(--border) bg-(--surface-2)">
                  <MentionTextarea
                    value={commentInput}
                    onChange={setCommentInput}
                    suggestions={mentionSuggestions}
                    rows={3}
                    placeholder={
                      canProject("comment")
                        ? "Add a comment… Type @ to mention a teammate"
                        : "You do not have permission to comment"
                    }
                    disabled={isPostingComment || !canProject("comment")}
                  />
                  {canProject("comment") ? (
                    <div className="flex items-center justify-end px-3 py-2 border-t border-(--border)">
                      <button
                        onClick={addComment}
                        disabled={isPostingComment || !commentInput.trim()}
                        className="h-7 px-3 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {isPostingComment ? "Posting…" : "Comment"}
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Comment list */}
                {(issue.comments ?? []).map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3"
                  >
                    <div className="shrink-0 mt-0.5">
                      {comment.author.image ? (
                        <img src={comment.author.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center text-xs font-medium text-sky-600">
                          {(comment.author.name || comment.author.email || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="grow">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-medium">{comment.author.name || comment.author.email || "Unknown"}</p>
                        <p className="text-xs text-(--muted-2)">{timeAgo(comment.createdAt)}</p>
                      </div>
                      <p className="text-sm text-(--muted) mt-1 whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  </div>
                ))}

                {(issue.comments ?? []).length === 0 && (
                  <p className="text-sm text-(--muted-2) py-4 text-center">No comments yet. Be the first to comment.</p>
                )}
              </div>
            )}

            {activityTab === "activity" && (
              <div className="space-y-2">
                {(issue.activities ?? []).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-2"
                  >
                    <div className="h-5 w-5 rounded-full bg-(--surface-3) flex items-center justify-center shrink-0 mt-0.5">
                      <div className="h-2 w-2 rounded-full bg-(--muted-2)" />
                    </div>
                    <div className="grow">
                      <p className="text-sm">
                        <span className="font-medium">{activity.actor.name || activity.actor.email || "Someone"}</span>
                        {" "}
                        <span className="text-(--muted-2)">
                          {activity.field ? `changed ${activity.field}` : activity.action.toLowerCase().replace("_", " ")}
                        </span>
                      </p>
                      {(activity.fromValue || activity.toValue) && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-red-400/60 line-through">{activity.fromValue || "(empty)"}</span>
                          <span className="text-(--muted-2)">→</span>
                          <span className="text-green-400/80">{activity.toValue || "(empty)"}</span>
                        </div>
                      )}
                      <p className="text-xs text-(--muted-2) mt-0.5">{timeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {(issue.activities ?? []).length === 0 && (
                  <p className="text-sm text-(--muted-2) py-4 text-center">No activity yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — metadata */}
        <div className="w-full md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-(--border) bg-(--surface-1) md:overflow-y-auto block">
          <div className="p-4 space-y-5">
            {/* Status */}
            <SidebarField label="Status">
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                disabled={!canEditTicket}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none disabled:opacity-70"
              >
                {statusesForTicketType(issue.ticketType ?? TicketType.INCIDENT).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </SidebarField>

            {/* Requester */}
            <SidebarField label="Requester">
              <input
                value={requesterNameInput}
                onChange={(e) => setRequesterNameInput(e.target.value)}
                placeholder="Who reported this?"
                readOnly={!canEditTicket}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
              />
              <input
                value={requesterEmailInput}
                onChange={(e) => setRequesterEmailInput(e.target.value)}
                placeholder="Requester email"
                readOnly={!canEditTicket}
                type="email"
                className="w-full mt-1.5 rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
              />
            </SidebarField>

            {/* Urgency */}
            <SidebarField label="Urgency">
              <select
                value={urgencyInput}
                onChange={(e) => setUrgencyInput(e.target.value as TicketUrgency)}
                disabled={!canEditTicket}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none disabled:opacity-70"
              >
                {URGENCY_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </SidebarField>

            {/* Priority */}
            <SidebarField label="Priority">
              <select
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
                disabled={!canEditTicket}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none disabled:opacity-70"
              >
                {PriorityOptionsArray.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </SidebarField>

            {/* Assignee */}
            <SidebarField label="Assignee">
              <select
                value={assignedUserInput}
                onChange={(e) => setAssignedUserInput(e.target.value)}
                disabled={!canEditTicket}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none disabled:opacity-70"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.user.id}>
                    {member.user.name || member.user.email || member.user.id}
                  </option>
                ))}
              </select>
            </SidebarField>

            {/* Due date */}
            <SidebarField label="Due date">
              <EnterpriseDatePicker
                label=""
                value={dueDateInput}
                onChange={setDueDateInput}
                disabled={!canEditTicket}
              />
              {issue.dueDate ? (
                <p
                  className={`mt-1 text-xs ${
                    isTicketOverdue({
                      dueDate: issue.dueDate,
                      status: issue.status,
                    })
                      ? "text-red-700 font-medium"
                      : "text-(--muted-2)"
                  }`}
                >
                  {slaCountdownLabel({ dueDate: issue.dueDate })}
                </p>
              ) : null}
            </SidebarField>

            {/* Sprint */}
            <SidebarField label="Sprint">
              <select
                value={sprintInput}
                onChange={(e) => setSprintInput(e.target.value)}
                disabled={!canEditTicket}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none disabled:opacity-70"
              >
                <option value="">Backlog (no sprint)</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name} ({sprint.status})
                  </option>
                ))}
              </select>
            </SidebarField>

            {/* Labels */}
            <SidebarField label="Labels">
              <input
                value={labelsInput}
                onChange={(e) => setLabelsInput(e.target.value)}
                placeholder="backend, urgent"
                readOnly={!canEditTicket}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
              />
              {labelsInput && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {labelsInput.split(",").map((l) => l.trim()).filter(Boolean).map((label) => (
                    <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </SidebarField>

            {/* Estimate */}
            <SidebarField label="Estimate">
              <select
                value={estimateInput ?? ""}
                onChange={(e) => setEstimateInput(e.target.value ? parseInt(e.target.value, 10) : null)}
                disabled={!canEditTicket}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none disabled:opacity-70"
              >
                <option value="">No estimate</option>
                {[1, 2, 3, 5, 8, 13, 21].map((v) => (
                  <option key={v} value={v}>{v} {v === 1 ? "point" : "points"}</option>
                ))}
              </select>
            </SidebarField>

            {/* Parent issue */}
            <SidebarField label="Parent issue">
              <select
                value={parentIssueInput}
                onChange={(e) => setParentIssueInput(e.target.value)}
                disabled={!canEditTicket}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none disabled:opacity-70"
              >
                <option value="">No parent</option>
                {issuesInProject
                  .filter((i) => i.id !== issue.id)
                  .map((i) => (
                    <option key={i.id} value={i.id}>{i.title}</option>
                  ))}
              </select>
            </SidebarField>

            {/* Metadata */}
            <div className="pt-4 border-t border-(--border) space-y-2 text-xs text-(--muted-2)">
              <p>Created {issue.createdAt ? timeAgo(issue.createdAt) : "–"}</p>
              <p>Updated {issue.updatedAt ? timeAgo(issue.updatedAt) : "–"}</p>
              <p className="font-mono text-[10px] opacity-60">{issue.id}</p>
            </div>

            {/* Relations summary */}
            <div className="pt-4 border-t border-(--border) space-y-2">
              <p className="text-xs font-medium text-(--muted-2) uppercase tracking-wide">Relations</p>
              <div className="space-y-1 text-sm text-(--muted-2)">
                <p>Subtasks: {issue.subtasks?.length ?? 0}</p>
                <p>Blocks: {issue.blockersFrom?.length ?? 0}</p>
                <p>Blocked by: {issue.blockedBy?.length ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-(--muted-2) mb-1.5 font-medium">{label}</p>
      {children}
    </div>
  );
}
