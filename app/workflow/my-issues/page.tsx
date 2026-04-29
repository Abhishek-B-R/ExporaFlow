"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

type MyIssue = {
  id: string;
  title: string;
  status?: string;
  priority?: string;
  Project?: { id: string; title: string };
  updatedAt: string;
};

export default function MyIssuesPage() {
  const [issues, setIssues] = useState<MyIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/issues/myissues");
        setIssues(res.data ?? []);
      } catch {
        customToast.error({ title: "", description: "Failed to load my issues." });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Target} windowTitle="My Issues">
      <div className="p-4">
        <p className="text-lg font-medium mb-3">Assigned and owned issues</p>
        <div className="space-y-2">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/workflow/project/${issue.Project?.id}/issues/${issue.id}`}
              className="block rounded-lg border border-(--border) bg-(--surface-1) hover:bg-(--surface-2) px-3 py-2 transition-colors"
            >
              <p className="text-sm">{issue.title}</p>
              <p className="text-xs text-(--muted-2) mt-1">
                {issue.Project?.title ?? "Project"} · {issue.status ?? "Backlog"} ·{" "}
                {issue.priority ?? "No Priority"}
              </p>
            </Link>
          ))}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg border border-(--border) bg-(--surface-1) px-3 py-3 animate-pulse">
                  <div className="h-3.5 bg-(--surface-3) rounded w-2/3 mb-2" />
                  <div className="h-2.5 bg-(--surface-3) rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : issues.length === 0 ? (
            <p className="text-sm text-(--muted-2)">No issues assigned yet.</p>
          ) : null}
        </div>
      </div>
    </WorkflowLayout>
  );
}

