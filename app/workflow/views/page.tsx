"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

type ProjectOption = { id: string; title: string };
type SavedView = {
  id: string;
  name: string;
  description?: string | null;
  projectId?: string | null;
  project?: { id: string; title: string } | null;
  filters: {
    statusFilter?: string;
    searchText?: string;
  };
};

export default function ViewsPage() {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    projectId: "",
    statusFilter: "",
    searchText: "",
  });

  const loadData = async () => {
    try {
      const [viewsRes, projectsRes] = await Promise.all([
        axios.get("/api/views"),
        axios.get("/api/workflow/getprojects"),
      ]);
      setSavedViews(viewsRes.data ?? []);
      setProjects(projectsRes.data ?? []);
    } catch {
      customToast.error({ title: "", description: "Failed to load saved views." });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createView = async () => {
    if (!form.name.trim() || !form.projectId) {
      customToast.error({
        title: "",
        description: "Name and project are required to save a view.",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      await axios.post("/api/views", {
        name: form.name,
        description: form.description,
        projectId: form.projectId,
        filters: {
          statusFilter: form.statusFilter || undefined,
          searchText: form.searchText || undefined,
        },
      });
      setForm({
        name: "",
        description: "",
        projectId: "",
        statusFilter: "",
        searchText: "",
      });
      await loadData();
    } catch {
      customToast.error({ title: "", description: "Failed to save view." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteView = async (viewId: string) => {
    try {
      await axios.delete(`/api/views/${viewId}`);
      setSavedViews((prev) => prev.filter((view) => view.id !== viewId));
    } catch {
      customToast.error({ title: "", description: "Failed to delete view." });
    }
  };

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Eye} windowTitle="Views">
      <div className="p-4 space-y-4">
        <div className="rounded-md border border-(--border) bg-(--surface-1) p-3 space-y-2">
          <p className="text-lg font-medium tracking-tight">Save issue filter view</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="View name"
              className="h-9 rounded-md border border-(--border) bg-(--surface-2) px-2"
            />
            <select
              value={form.projectId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, projectId: event.target.value }))
              }
              className="h-9 rounded-md border border-(--border) bg-(--surface-2) px-2"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
          <input
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Description (optional)"
            className="w-full h-9 rounded-md border border-(--border) bg-(--surface-2) px-2"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={form.statusFilter}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, statusFilter: event.target.value }))
              }
              placeholder="Status filter (e.g. In Progress)"
              className="h-9 rounded-md border border-(--border) bg-(--surface-2) px-2"
            />
            <input
              value={form.searchText}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, searchText: event.target.value }))
              }
              placeholder="Search text"
              className="h-9 rounded-md border border-(--border) bg-(--surface-2) px-2"
            />
          </div>
          <button
            onClick={createView}
            disabled={isSubmitting}
            className="h-9 px-3 rounded-md border border-(--border-strong) bg-(--surface-3) hover:bg-(--surface-4)"
          >
            {isSubmitting ? "Saving..." : "Save view"}
          </button>
        </div>

        <div>
          <p className="text-lg font-medium mb-2">Saved views</p>
          <div className="space-y-2">
            {savedViews.map((view) => (
              <div key={view.id} className="rounded-md border border-(--border) bg-(--surface-1) px-3 py-2">
                <p className="text-sm">{view.name}</p>
                <p className="text-xs text-(--muted-2) mt-1">
                  {view.description || "No description"} · {view.project?.title || "Project"}
                </p>
                <div className="mt-2 flex gap-2">
                  {view.project?.id ? (
                    <Link
                      href={`/workflow/project/${view.project.id}/issues?status=${encodeURIComponent(
                        view.filters?.statusFilter || "",
                      )}&q=${encodeURIComponent(view.filters?.searchText || "")}`}
                      className="text-xs rounded-md border border-(--border) bg-(--surface-2) px-2 py-1 hover:bg-(--surface-3)"
                    >
                      Open
                    </Link>
                  ) : (
                    <button
                      disabled
                      title="Project no longer exists."
                      className="text-xs rounded-md border border-(--border) bg-(--surface-2) px-2 py-1 opacity-50 cursor-not-allowed"
                    >
                      Open
                    </button>
                  )}
                  <button
                    onClick={() => deleteView(view.id)}
                    className="text-xs rounded-md border border-(--border) bg-(--surface-2) px-2 py-1 hover:bg-(--surface-3)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {savedViews.length === 0 && (
              <p className="text-sm text-(--muted-2)">No saved views yet.</p>
            )}
          </div>
        </div>
      </div>
    </WorkflowLayout>
  );
}
