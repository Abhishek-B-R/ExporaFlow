"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

type InboxIssue = {
  id: string;
  title: string;
  status?: string;
  updatedAt: string;
  Project?: { id: string; title: string };
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxIssue[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/issues/inbox");
        setItems(res.data ?? []);
      } catch {
        customToast.error({ title: "", description: "Failed to load inbox." });
      }
    };
    load();
  }, []);

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Inbox} windowTitle="Inbox">
      <div className="p-4">
        <p className="text-lg font-medium mb-3">Recent issue activity</p>
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/workflow/project/${item.Project?.id}/issues/${item.id}`}
              className="block rounded-lg border border-(--border) bg-(--surface-1) hover:bg-(--surface-2) px-3 py-2 transition-colors"
            >
              <p className="text-sm">{item.title}</p>
              <p className="text-xs text-(--muted-2) mt-1">
                {item.Project?.title ?? "Project"} · {item.status ?? "Backlog"} ·{" "}
                {new Date(item.updatedAt).toLocaleString()}
              </p>
            </Link>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-(--muted-2)">No updates yet.</p>
          )}
        </div>
      </div>
    </WorkflowLayout>
  );
}

