"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { customToast } from "@/lib/custom-toast";
import { RAW_ICONS } from "@/lib/icons";
import axios from "axios";
import { useState } from "react";

export default function ImportIssuesPage() {
  const [projectId, setProjectId] = useState("");
  const [csv, setCsv] = useState("title,description,status,priority\n");
  const [jiraJson, setJiraJson] = useState('{ "issues": [] }');
  const [isImporting, setIsImporting] = useState(false);

  const importCsv = async () => {
    if (!projectId.trim()) {
      customToast.error({ title: "", description: "Project ID is required." });
      return;
    }
    if (!csv.trim()) {
      customToast.error({ title: "", description: "No rows to import." });
      return;
    }

    try {
      setIsImporting(true);
      const response = await axios.post("/api/import/csv", {
        projectId: projectId.trim(),
        csv,
      });
      customToast.success({
        title: "",
        description: `CSV import complete (${response.data.imported ?? 0} issues).`,
      });
    } catch {
      customToast.error({ title: "", description: "Import failed." });
    } finally {
      setIsImporting(false);
    }
  };

  const importJira = async () => {
    if (!projectId.trim()) {
      customToast.error({ title: "", description: "Project ID is required." });
      return;
    }
    try {
      setIsImporting(true);
      const parsed = JSON.parse(jiraJson);
      const response = await axios.post("/api/import/jira", {
        projectId: projectId.trim(),
        issues: Array.isArray(parsed?.issues) ? parsed.issues : [],
      });
      customToast.success({
        title: "",
        description: `Jira import complete (${response.data.imported ?? 0} issues).`,
      });
    } catch {
      customToast.error({ title: "", description: "Jira import failed. Check JSON format." });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Target} windowTitle="Import Issues">
      <div className="p-4">
        <p className="text-lg font-medium mb-2">Import issues (CSV / Jira)</p>
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

        <p className="text-sm text-(--muted-2) mt-6">Jira JSON (expects {`{ issues: [...] }`})</p>
        <textarea
          value={jiraJson}
          onChange={(e) => setJiraJson(e.target.value)}
          className="mt-2 h-40 w-full rounded border border-(--border) bg-(--surface-1) px-2 py-2 text-sm"
        />
        <button
          onClick={importJira}
          disabled={isImporting}
          className="mt-3 h-9 px-3 rounded border border-(--border-strong) bg-(--surface-3) disabled:opacity-50"
        >
          {isImporting ? "Importing..." : "Import Jira JSON"}
        </button>
      </div>
    </WorkflowLayout>
  );
}

