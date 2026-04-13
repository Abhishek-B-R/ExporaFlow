"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import axios from "axios";
import { useEffect, useState } from "react";

type AuditItem = {
  id: string;
  action: string;
  field?: string | null;
  fromValue?: string | null;
  toValue?: string | null;
  createdAt: string;
  issue: { id: string; title: string; projectId: string };
  actor: { id: string; name?: string | null; email?: string | null };
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get("/api/admin/audit");
        setLogs(response.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <WorkflowLayout windowTitle="Admin Audit Trail" windowSvg={RAW_ICONS.Eye}>
      <div className="p-4 space-y-3">
        <p className="text-sm text-(--muted-2)">
          Critical action timeline with actor, issue context, and value changes.
        </p>
        {loading ? (
          <p className="text-sm text-(--muted-2)">Loading audit logs...</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-md border border-(--border) bg-(--surface-1) px-3 py-2">
                <p className="text-sm">
                  {log.actor.name || log.actor.email || "Unknown"} · {log.action}
                  {log.field ? ` (${log.field})` : ""}
                </p>
                <p className="text-xs text-(--muted-2)">
                  {log.issue.title} · {new Date(log.createdAt).toLocaleString()}
                </p>
                {(log.fromValue || log.toValue) && (
                  <p className="text-xs text-(--muted-2)">
                    {log.fromValue || "(empty)"} → {log.toValue || "(empty)"}
                  </p>
                )}
              </div>
            ))}
            {!logs.length && <p className="text-sm text-(--muted-2)">No audit entries yet.</p>}
          </div>
        )}
      </div>
    </WorkflowLayout>
  );
}
