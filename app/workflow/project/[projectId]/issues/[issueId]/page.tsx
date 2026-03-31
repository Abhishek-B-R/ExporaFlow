"use client";

import { customToast } from "@/lib/custom-toast";
import { IssueBody, SprintBody } from "@/utils/types";
import { IssueStatus, PriorityOptionsArray } from "@/utils/issues-view-options";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

type WorkspaceMember = {
  id: string;
  user: { id: string; name?: string; email?: string };
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
};

export default function Issue({
  params,
}: {
  params: Promise<{ issueId: string; projectId: string }>;
}) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [issue_id, setIssueId] = useState<string | null>(null);
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setIssueId(resolvedParams.issueId);
      setProjectId(resolvedParams.projectId);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    if (!issue_id || !projectId) return;
    const fetchIssue = async () => {
      try {
        const [issueRes, sprintRes, allIssuesRes, membersRes] = await Promise.all([
          axios.post("/api/issues/getissue", { issueId: issue_id }),
          axios.post("/api/sprints/getsprints", { projectId }),
          axios.post("/api/issues/getissues", { project_id: projectId }),
          axios.get("/api/workflow/getmembers"),
        ]);
        const issueData = issueRes.data as FullIssue;
        setIssue(issueData);
        setSprints(sprintRes.data ?? []);
        setIssuesInProject(allIssuesRes.data ?? []);
        setMembers(membersRes.data ?? []);

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
      } catch {
        customToast.error({ title: "", description: "Failed to fetch issue details." });
      }
    };
    fetchIssue();
  }, [issue_id, projectId]);

  const saveIssueMeta = async () => {
    if (!issue_id || !issue) return;
    try {
      setIsSaving(true);
      const labels = labelsInput
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);
      await Promise.all([
        axios.patch("/api/issues/updateissue", {
          issueId: issue_id,
          issueTitle: titleInput.trim(),
          issueDescription: descriptionInput,
          issueStatus: statusInput,
          issuePriority: priorityInput,
          assignedUser: assignedUserInput || null,
          parentIssueId: parentIssueInput || null,
          dueDate: dueDateInput || null,
          labels,
        }),
        axios.patch("/api/sprints/assignissue", {
          issueId: issue_id,
          sprintId: sprintInput || null,
        }),
      ]);

      setIssue((prev) =>
        prev
          ? {
              ...prev,
              title: titleInput.trim(),
              description: descriptionInput,
              status: statusInput,
              priority: priorityInput,
              assignedUser: assignedUserInput || null,
              parentIssueId: parentIssueInput || null,
              dueDate: dueDateInput || null,
              labels,
              sprintId: sprintInput || null,
            }
          : prev
      );
      customToast.success({ title: "", description: "Issue details updated." });
    } catch {
      customToast.error({ title: "", description: "Failed to update issue details." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grow min-h-screen px-4 md:px-8 py-5">
      <div className="flex items-center justify-between mb-4">
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
        <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <p className="text-xs text-(--muted-2) mb-1">Title</p>
              <input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
              />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-(--muted-2) mb-1">Description</p>
              <textarea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
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
                onChange={(e) => setStatusInput(e.target.value)}
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
                onChange={(e) => setPriorityInput(e.target.value)}
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
                onChange={(e) => setDueDateInput(e.target.value)}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
              />
            </div>
            <div>
              <p className="text-xs text-(--muted-2) mb-1">Assignee</p>
              <select
                value={assignedUserInput}
                onChange={(e) => setAssignedUserInput(e.target.value)}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.user.id}>
                    {m.user.name || m.user.email || m.user.id}
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
                onChange={(e) => setLabelsInput(e.target.value)}
                placeholder="backend, urgent"
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
              />
            </div>
            <div>
              <p className="text-xs text-(--muted-2) mb-1">Sprint</p>
              <select
                value={sprintInput}
                onChange={(e) => setSprintInput(e.target.value)}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
              >
                <option value="">Backlog (no sprint)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-(--muted-2) mb-1">Parent issue</p>
              <select
                value={parentIssueInput}
                onChange={(e) => setParentIssueInput(e.target.value)}
                className="w-full rounded-md border border-(--border) bg-(--surface-2) px-2 h-9"
              >
                <option value="">No parent</option>
                {issuesInProject
                  .filter((i) => i.id !== issue.id)
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
      )}
    </div>
  );
}
