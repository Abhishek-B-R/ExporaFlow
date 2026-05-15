"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

type InboxIssue = {
  id: string;
  type: string;
  title: string;
  body?: string;
  readAt?: string | null;
  createdAt: string;
  issue?: { id: string; title: string } | null;
  project?: { id: string; title: string } | null;
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/notifications");
        setItems(res.data ?? []);
      } catch {
        customToast.error({ title: "", description: "Failed to load inbox." });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const markAllRead = async () => {
    try {
      await axios.patch("/api/notifications", { markAll: true });
      setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    } catch {
      customToast.error({ title: "", description: "Failed to update notifications." });
    }
  };

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Inbox} windowTitle="Inbox">
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-medium tracking-tight">Notifications</p>
          <button
            onClick={markAllRead}
            className="text-xs rounded-md border border-(--border) bg-(--surface-2) px-2 py-1 hover:bg-(--surface-3)"
          >
            Mark all as read
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={
                item.issue?.id && item.project?.id
                  ? `/workflow/project/${item.project.id}/incident-tickets/${item.issue.id}`
                  : "/workflow/project"
              }
              className={`block rounded-md border px-3 py-2 transition-colors ${
                item.readAt
                  ? "border-(--border) bg-(--surface-1) hover:bg-(--surface-2)"
                  : "border-(--border-strong) bg-(--surface-2) hover:bg-(--surface-3)"
              }`}
            >
              <p className="text-sm">{item.title}</p>
              {item.body ? <p className="text-xs text-(--muted-2) mt-1">{item.body}</p> : null}
              <p className="text-xs text-(--muted-2) mt-1">
                {item.project?.title ?? "Project"} · {item.type} ·{" "}
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </Link>
          ))}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-md border border-(--border) bg-(--surface-1) px-3 py-3 animate-pulse">
                  <div className="h-3.5 bg-(--surface-3) rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-(--surface-3) rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-(--muted-2)">No updates yet.</p>
          ) : null}
        </div>
      </div>
    </WorkflowLayout>
  );
}

