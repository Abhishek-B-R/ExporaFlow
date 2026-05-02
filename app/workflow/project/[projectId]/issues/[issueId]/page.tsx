"use client";

import { customToast } from "@/lib/custom-toast";
import { IssueBody, SprintBody } from "@/utils/types";
import { IssueStatus, PriorityOptionsArray } from "@/utils/issues-view-options";
import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RenderStatusSvg, renderPrioritySvg } from "@/components/workflow/issues/issue-label";
import { useRouter } from "next/navigation";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";

type WorkspaceMember = {
  id: string;
  user: { id: string; name?: string; email?: string; image?: string };
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
  createdAt?: string;
  User?: { id: string; name?: string; email?: string; image?: string } | null;
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
  params: Promise<{ issueId: string; projectId: string }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [issueId, setIssueId] = useState<string | null>(null);
  const [issue, setIssue] = useState<FullIssue | null>(null);
  const [sprints, setSprints] = useState<SprintBody[]>([]);
  const [issuesInProject, setIssuesInProject] = useState<IssueBody[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const router = useRouter();

  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [statusInput, setStatusInput] = useState("Backlog");
  const [priorityInput, setPriorityInput] = useState("No Priority");
  const [assignedUserInput, setAssignedUserInput] = useState("");
  const [parentIssueInput, setParentIssueInput] = useState("");
  const [labelsInput, setLabelsInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
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
      setIssueId(resolvedParams.issueId);
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
    setEstimateInput((issueData as any).estimate ?? null);
  }, []);

  const fetchIssueData = useCallback(
    async (options?: { resetForm?: boolean }) => {
      if (!issueId || !projectId) return;
      const [issueRes, sprintRes, allIssuesRes, membersRes] = await Promise.all([
        axios.post("/api/issues/getissue", { issueId }),
        axios.post("/api/sprints/getsprints", { projectId }),
        axios.post("/api/issues/getissues", { project_id: projectId }),
        axios.get("/api/workflow/getmembers", { params: { projectId } }),
      ]);

      const issueData = issueRes.data as FullIssue;
      setIssue(issueData);
      setSprints(sprintRes.data ?? []);
      setIssuesInProject(allIssuesRes.data ?? []);
      setMembers(membersRes.data ?? []);
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
        labels,
        estimate: estimateInput,
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
      router.push(`/workflow/project/${projectId}/issues`);
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

  const mentionHints = useMemo(
    () =>
      members.map((member) => {
        const handle =
          member.user.name?.toLowerCase().replace(/\s+/g, "") ??
          member.user.email?.split("@")[0] ??
          member.user.id;
        return {
          id: member.user.id,
          label: member.user.name || member.user.email || member.user.id,
          handle,
        };
      }),
    [members],
  );

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
          <div className="h-5 w-5 border-2 border-[#6f86ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-(--muted-2)">Loading issue…</p>
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
              href={`/workflow/project/${projectId}/issues`}
              className="text-sm text-(--muted-2) hover:text-white transition-colors flex items-center gap-1"
            >
              <SVGIcon className="flex w-4" svgString={RAW_ICONS.ArrowLeft ?? RAW_ICONS.Close} />
              Back
            </Link>
          )}
          <span className="text-(--muted-2) text-xs">·</span>
          <p className="text-xs text-(--muted-2) font-mono">{issue.id.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={deleteIssue}
            disabled={isDeleting || isSaving}
            className="h-7 px-3 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete issue"}
          </button>
          <button
            onClick={saveIssueMeta}
            disabled={isSaving || isDeleting}
            className="h-7 px-3 rounded-md bg-[#6f86ff] hover:bg-[#5a70e6] text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
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
            className="w-full bg-transparent text-xl md:text-2xl font-semibold outline-none border-none placeholder:text-(--muted-2)"
            placeholder="Issue title"
          />

          {/* Description */}
          <textarea
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            rows={6}
            className="w-full bg-transparent text-sm text-[#c0c0c4] outline-none border-none resize-none placeholder:text-(--muted-2) leading-relaxed"
            placeholder="Add a description… (supports markdown)"
          />

          {/* Sub-issues */}
          {(issue.subtasks ?? []).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-(--muted-2) uppercase tracking-wide">Sub-issues</p>
              <div className="space-y-1">
                {issue.subtasks!.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/workflow/project/${projectId}/issues/${sub.id}`}
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
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activityTab === "comments" ? "border-[#6f86ff] text-white" : "border-transparent text-(--muted-2) hover:text-white"}`}
              >
                Comments ({(issue.comments ?? []).length})
              </button>
              <button
                onClick={() => setActivityTab("activity")}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activityTab === "activity" ? "border-[#6f86ff] text-white" : "border-transparent text-(--muted-2) hover:text-white"}`}
              >
                Activity ({(issue.activities ?? []).length})
              </button>
            </div>

            {activityTab === "comments" && (
              <div className="space-y-3">
                {/* Comment input */}
                <div className="rounded-lg border border-(--border) bg-(--surface-2) overflow-hidden">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    rows={3}
                    placeholder="Add a comment… Use @username for mentions"
                    className="w-full bg-transparent px-3 py-2.5 text-sm outline-none resize-none placeholder:text-(--muted-2)"
                  />
                  <div className="flex items-center justify-between px-3 py-2 border-t border-(--border)">
                    <div className="flex flex-wrap gap-1">
                      {mentionHints.slice(0, 5).map((hint) => (
                        <button
                          key={hint.id}
                          onClick={() => setCommentInput((prev) => `${prev} @${hint.handle}`.trim())}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-(--surface-3) text-(--muted-2) hover:text-white transition-colors"
                        >
                          @{hint.handle}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={addComment}
                      disabled={isPostingComment || !commentInput.trim()}
                      className="h-7 px-3 rounded-md bg-[#6f86ff] hover:bg-[#5a70e6] text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isPostingComment ? "Posting…" : "Comment"}
                    </button>
                  </div>
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
                        <div className="h-7 w-7 rounded-full bg-[#6f86ff]/20 flex items-center justify-center text-xs font-medium text-[#6f86ff]">
                          {(comment.author.name || comment.author.email || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="grow">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-medium">{comment.author.name || comment.author.email || "Unknown"}</p>
                        <p className="text-xs text-(--muted-2)">{timeAgo(comment.createdAt)}</p>
                      </div>
                      <p className="text-sm text-[#c0c0c4] mt-1 whitespace-pre-wrap">{comment.body}</p>
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
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
              >
                {IssueStatus.map((s) => (
                  <option key={s.title} value={s.title}>{s.title}</option>
                ))}
              </select>
            </SidebarField>

            {/* Priority */}
            <SidebarField label="Priority">
              <select
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
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
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
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
              <input
                type="date"
                value={dueDateInput}
                onChange={(e) => setDueDateInput(e.target.value)}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
              />
            </SidebarField>

            {/* Sprint */}
            <SidebarField label="Sprint">
              <select
                value={sprintInput}
                onChange={(e) => setSprintInput(e.target.value)}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
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
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
              />
              {labelsInput && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {labelsInput.split(",").map((l) => l.trim()).filter(Boolean).map((label) => (
                    <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-[#6f86ff]/15 text-[#6f86ff] border border-[#6f86ff]/20">
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
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
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
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-8 text-sm outline-none"
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
