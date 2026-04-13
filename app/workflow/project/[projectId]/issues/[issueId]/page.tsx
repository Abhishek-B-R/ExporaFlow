"use client";

import { customToast } from "@/lib/custom-toast";
import { IssueBody, SprintBody } from "@/utils/types";
import { IssueStatus, PriorityOptionsArray } from "@/utils/issues-view-options";
import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type WorkspaceMember = {
  id: string;
  user: { id: string; name?: string; email?: string };
};

type IssueComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name?: string; email?: string };
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
  User?: { id: string; name?: string; email?: string } | null;
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

  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [statusInput, setStatusInput] = useState("Backlog");
  const [priorityInput, setPriorityInput] = useState("No Priority");
  const [assignedUserInput, setAssignedUserInput] = useState("");
  const [parentIssueInput, setParentIssueInput] = useState("");
  const [labelsInput, setLabelsInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [sprintInput, setSprintInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

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
      });

      customToast.success({ title: "", description: "Issue details updated." });
      await fetchIssueData({ resetForm: true });
    } catch {
      customToast.error({ title: "", description: "Failed to update issue details." });
    } finally {
      setIsSaving(false);
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

  return (
    <div className="grow min-h-screen px-4 md:px-8 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xl font-medium">Issue Details</p>
        {projectId && (
          <Link
            href={`/workflow/project/${projectId}/issues`}
            className="text-sm border border-(--border) bg-(--surface-2) hover:bg-(--surface-3) rounded-lg px-3 py-2 transition-colors"
          >
            Back to issues
          </Link>
        )}
      </div>
      {!issue ? (
        <p className="text-sm text-(--muted-2)">Loading issue...</p>
      ) : (
        <>
          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <p className="text-xs text-(--muted-2) mb-1">Title</p>
                <input
                  value={titleInput}
                  onChange={(event) => setTitleInput(event.target.value)}
                  className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-(--muted-2) mb-1">Description</p>
                <textarea
                  value={descriptionInput}
                  onChange={(event) => setDescriptionInput(event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-(--muted-2) mb-1">Status</p>
                <select
                  value={statusInput}
                  onChange={(event) => setStatusInput(event.target.value)}
                  className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
                >
                  {IssueStatus.map((status) => (
                    <option key={status.title} value={status.title}>
                      {status.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-(--muted-2) mb-1">Priority</p>
                <select
                  value={priorityInput}
                  onChange={(event) => setPriorityInput(event.target.value)}
                  className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
                >
                  {PriorityOptionsArray.map((priority) => (
                    <option key={priority.name} value={priority.name}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-(--muted-2) mb-1">Due date</p>
                <input
                  type="date"
                  value={dueDateInput}
                  onChange={(event) => setDueDateInput(event.target.value)}
                  className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
                />
              </div>
              <div>
                <p className="text-xs text-(--muted-2) mb-1">Assignee</p>
                <select
                  value={assignedUserInput}
                  onChange={(event) => setAssignedUserInput(event.target.value)}
                  className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.user.id}>
                      {member.user.name || member.user.email || member.user.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-(--muted-2) mb-1">Labels (comma separated)</p>
                <input
                  value={labelsInput}
                  onChange={(event) => setLabelsInput(event.target.value)}
                  placeholder="backend, urgent"
                  className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
                />
              </div>
              <div>
                <p className="text-xs text-(--muted-2) mb-1">Sprint</p>
                <select
                  value={sprintInput}
                  onChange={(event) => setSprintInput(event.target.value)}
                  className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
                >
                  <option value="">Backlog (no sprint)</option>
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name} ({sprint.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-(--muted-2) mb-1">Parent issue</p>
                <select
                  value={parentIssueInput}
                  onChange={(event) => setParentIssueInput(event.target.value)}
                  className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
                >
                  <option value="">No parent</option>
                  {issuesInProject
                    .filter((projectIssue) => projectIssue.id !== issue.id)
                    .map((projectIssue) => (
                      <option key={projectIssue.id} value={projectIssue.id}>
                        {projectIssue.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-(--border) bg-(--surface-2) p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-(--muted-2) mb-1">Metadata</p>
                <p>Issue ID: {issue.id}</p>
                <p>Created: {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : "-"}</p>
                <p>Updated: {issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : "-"}</p>
              </div>
              <div>
                <p className="text-xs text-(--muted-2) mb-1">Relationships</p>
                <p>Subtasks: {issue.subtasks?.length ?? 0}</p>
                <p>Blocks: {issue.blockersFrom?.length ?? 0}</p>
                <p>Blocked by: {issue.blockedBy?.length ?? 0}</p>
              </div>
            </div>

            <button
              onClick={saveIssueMeta}
              disabled={isSaving}
              className="h-9 px-3 rounded-md bg-(--surface-3) border border-(--border-strong) hover:opacity-90 transition-opacity"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>

          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-3">
            <p className="text-sm font-medium">Comments & mentions</p>
            <textarea
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
              rows={3}
              placeholder="Add a comment... Use @username for mentions"
              className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 py-2"
            />
            <div className="flex flex-wrap gap-2">
              {mentionHints.slice(0, 8).map((hint) => (
                <button
                  key={hint.id}
                  onClick={() => setCommentInput((prev) => `${prev} @${hint.handle}`.trim())}
                  className="text-xs px-2 py-1 rounded border border-(--border) bg-(--surface-2)"
                >
                  @{hint.handle}
                </button>
              ))}
            </div>
            <button
              onClick={addComment}
              disabled={isPostingComment || !commentInput.trim()}
              className="h-9 px-3 rounded-md bg-(--surface-3) border border-(--border-strong) hover:opacity-90 disabled:opacity-50"
            >
              {isPostingComment ? "Posting..." : "Add comment"}
            </button>
            <div className="space-y-2">
              {(issue.comments ?? []).map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-md border border-(--border) bg-(--surface-2) px-3 py-2"
                >
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                  <p className="text-xs text-(--muted-2) mt-1">
                    {(comment.author.name || comment.author.email || "Unknown")} ·{" "}
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {(issue.comments ?? []).length === 0 && (
                <p className="text-sm text-(--muted-2)">No comments yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-2">
            <p className="text-sm font-medium">Activity log</p>
            {(issue.activities ?? []).map((activity) => (
              <div
                key={activity.id}
                className="rounded-md border border-(--border) bg-(--surface-2) px-3 py-2 text-sm"
              >
                <p>
                  {activity.actor.name || activity.actor.email || "Someone"} · {activity.action}
                  {activity.field ? ` (${activity.field})` : ""}
                </p>
                {(activity.fromValue || activity.toValue) && (
                  <p className="text-xs text-(--muted-2)">
                    {activity.fromValue || "(empty)"} → {activity.toValue || "(empty)"}
                  </p>
                )}
                <p className="text-xs text-(--muted-2)">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {(issue.activities ?? []).length === 0 && (
              <p className="text-sm text-(--muted-2)">No activity yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
