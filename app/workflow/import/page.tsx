"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { customToast } from "@/lib/custom-toast";
import { RAW_ICONS } from "@/lib/icons";
import axios from "axios";
import { useState } from "react";

export default function ImportIssuesPage() {
  const [projectId, setProjectId] = useState("");
  const [csv, setCsv] = useState("title,description,status,priority\n");
  const [isImporting, setIsImporting] = useState(false);

  const importCsv = async () => {
    if (!projectId.trim()) {
      customToast.error({ title: "", description: "Project ID is required." });
      return;
    }
    const rows = csv
      .split("\n")
      .slice(1)
      .map((line) => line.trim())
      .filter(Boolean);

    if (rows.length === 0) {
      customToast.error({ title: "", description: "No rows to import." });
      return;
    }

    try {
      setIsImporting(true);
      for (const row of rows) {
        const [title, description, status, priority] = row
          .split(",")
          .map((cell) => cell.trim());
        if (!title) continue;
        await axios.post("/api/issues/createissue", {
          issueTitle: title,
          issueDescription: description || "",
          issueStatus: status || "Backlog",
          issuePriority: priority || "No Priority",
          projectId: projectId.trim(),
        });
      }
      customToast.success({ title: "", description: "CSV issues imported." });
    } catch {
      customToast.error({ title: "", description: "Import failed." });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Target} windowTitle="Import Issues">
      <div className="p-4">
        <p className="text-lg font-medium mb-2">Import issues (CSV)</p>
        <p className="text-sm text-(--muted-2)">
          CSV columns: title, description, status, priority
        </p>
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Project ID"
          className="mt-3 h-9 w-full rounded border border-(--border) bg-(--surface-2) px-2"
        />
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          className="mt-3 h-48 w-full rounded border border-(--border) bg-(--surface-1) px-2 py-2 text-sm"
        />
        <button
          onClick={importCsv}
          disabled={isImporting}
          className="mt-3 h-9 px-3 rounded border border-(--border-strong) bg-(--surface-3) disabled:opacity-50"
        >
          {isImporting ? "Importing..." : "Import CSV"}
        </button>
      </div>
    </WorkflowLayout>
  );
}

