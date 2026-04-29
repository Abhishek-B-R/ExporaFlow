"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { customToast } from "@/lib/custom-toast";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

type ProjectOption = {
  id: string;
  title: string;
};

type ImportTab = "csv" | "jira" | "github";

export default function ImportIssuesPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [activeTab, setActiveTab] = useState<ImportTab>("csv");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    count: number;
    source: string;
  } | null>(null);

  // CSV state
  const [csvContent, setCsvContent] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Jira state
  const [jiraJson, setJiraJson] = useState("");

  // GitHub state
  const [githubRepo, setGithubRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      const res = await axios.get("/api/workflow/getprojects");
      if (Array.isArray(res.data)) {
        setProjects(res.data);
        if (res.data.length > 0 && !projectId) {
          setProjectId(res.data[0].id);
        }
      }
    } catch {
      // silent
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvContent(evt.target?.result as string);
    };
    reader.readAsText(file);
  };

  const importCsv = async () => {
    if (!projectId) {
      customToast.error({ title: "", description: "Select a project first." });
      return;
    }
    if (!csvContent.trim()) {
      customToast.error({ title: "", description: "No CSV content to import. Paste or upload a file." });
      return;
    }
    try {
      setIsImporting(true);
      setImportResult(null);
      const res = await axios.post("/api/import/csv", {
        projectId,
        csv: csvContent,
      });
      const count = res.data.imported ?? 0;
      setImportResult({ count, source: "CSV" });
      customToast.success({ title: "Import complete", description: `${count} issues imported from CSV.` });
      setCsvContent("");
      setCsvFileName("");
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "CSV import failed."
        : "CSV import failed.";
      customToast.error({ title: "Import failed", description: msg });
    } finally {
      setIsImporting(false);
    }
  };

  const importJira = async () => {
    if (!projectId) {
      customToast.error({ title: "", description: "Select a project first." });
      return;
    }
    if (!jiraJson.trim()) {
      customToast.error({ title: "", description: "Paste Jira JSON export data." });
      return;
    }
    try {
      setIsImporting(true);
      setImportResult(null);
      const parsed = JSON.parse(jiraJson);
      const issues = Array.isArray(parsed?.issues) ? parsed.issues : Array.isArray(parsed) ? parsed : [];
      const res = await axios.post("/api/import/jira", { projectId, issues });
      const count = res.data.imported ?? 0;
      setImportResult({ count, source: "Jira" });
      customToast.success({ title: "Import complete", description: `${count} issues imported from Jira.` });
      setJiraJson("");
    } catch {
      customToast.error({ title: "Import failed", description: "Jira import failed. Check the JSON format." });
    } finally {
      setIsImporting(false);
    }
  };

  const importGitHub = async () => {
    if (!projectId) {
      customToast.error({ title: "", description: "Select a project first." });
      return;
    }
    if (!githubRepo.trim()) {
      customToast.error({ title: "", description: "Enter a GitHub repo (owner/repo format)." });
      return;
    }
    try {
      setIsImporting(true);
      setImportResult(null);
      const res = await axios.post("/api/import/github", {
        projectId,
        repo: githubRepo.trim(),
        token: githubToken.trim() || undefined,
      });
      const count = res.data.imported ?? 0;
      setImportResult({ count, source: "GitHub" });
      customToast.success({ title: "Import complete", description: `${count} issues imported from GitHub.` });
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "GitHub import failed."
        : "GitHub import failed.";
      customToast.error({ title: "Import failed", description: msg });
    } finally {
      setIsImporting(false);
    }
  };

  const tabClass = (tab: ImportTab) =>
    `h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
      activeTab === tab
        ? "bg-[#6f86ff]/15 text-[#6f86ff] border border-[#6f86ff]/30"
        : "border border-(--border) text-(--muted-2) hover:bg-(--surface-2)"
    }`;

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Target} windowTitle="Import Issues">
      <div className="grow overflow-y-auto px-4 md:px-6 py-5 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-medium">Import Issues</h1>
          <p className="text-sm text-(--muted-2) mt-1">
            Bring your issues from CSV files, Jira exports, or GitHub repositories.
          </p>
        </div>

        {/* Project Selector */}
        <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4">
          <label className="text-sm font-medium block mb-2">Target Project</label>
          {projects.length === 0 ? (
            <p className="text-sm text-(--muted-2)">No projects found. Create a project first.</p>
          ) : (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-10 w-full max-w-md rounded-lg border border-(--border) bg-(--surface-2) px-3 text-sm outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Import result */}
        {importResult && (
          <div className="rounded-lg border border-[#30b27a]/30 bg-[#30b27a]/5 p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#30b27a]/20 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 12.5L10.5 15L16 9" stroke="#30b27a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#30b27a]">
                Successfully imported {importResult.count} issue{importResult.count !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-(--muted-2)">Source: {importResult.source}</p>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("csv")} className={tabClass("csv")}>
            CSV / File Upload
          </button>
          <button onClick={() => setActiveTab("jira")} className={tabClass("jira")}>
            Jira JSON
          </button>
          <button onClick={() => setActiveTab("github")} className={tabClass("github")}>
            GitHub Issues
          </button>
        </div>

        {/* CSV Tab */}
        {activeTab === "csv" && (
          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Import from CSV</p>
              <p className="text-xs text-(--muted-2) mt-1">
                Upload a CSV file or paste CSV content directly. Expected columns: <code className="bg-(--surface-2) px-1 rounded">title</code>, <code className="bg-(--surface-2) px-1 rounded">description</code>, <code className="bg-(--surface-2) px-1 rounded">status</code>, <code className="bg-(--surface-2) px-1 rounded">priority</code>
              </p>
            </div>

            {/* File upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-(--border) rounded-lg p-6 text-center cursor-pointer hover:border-[#6f86ff]/40 hover:bg-[#6f86ff]/5 transition-colors"
            >
              <SVGIcon className="inline-flex w-8 mb-2 opacity-40" svgString={RAW_ICONS.Download} />
              {csvFileName ? (
                <p className="text-sm">
                  <span className="text-[#6f86ff] font-medium">{csvFileName}</span> selected
                </p>
              ) : (
                <>
                  <p className="text-sm text-(--muted-2)">Click to upload a CSV file</p>
                  <p className="text-xs text-(--muted-2) mt-1">.csv files only</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Or paste */}
            <div>
              <p className="text-xs text-(--muted-2) mb-1">Or paste CSV content:</p>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={`title,description,status,priority\n"Fix login bug","Users can't login with Google",Working,High\n"Add dark mode","Support theme toggle",Backlog,Medium`}
                className="w-full h-40 rounded-lg border border-(--border) bg-(--surface-2) px-3 py-2 text-sm font-mono resize-none outline-none focus:border-[#6f86ff]/40 transition-colors"
              />
            </div>

            <button
              onClick={importCsv}
              disabled={isImporting || !csvContent.trim() || !projectId}
              className="h-10 px-5 rounded-lg bg-gradient-to-b from-[#6f86ff] to-[#5a6ee0] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isImporting ? "Importing…" : "Import CSV"}
            </button>
          </div>
        )}

        {/* Jira Tab */}
        {activeTab === "jira" && (
          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Import from Jira</p>
              <p className="text-xs text-(--muted-2) mt-1">
                Paste the JSON export from Jira. Expects the standard Jira REST API format with <code className="bg-(--surface-2) px-1 rounded">{`{ "issues": [...] }`}</code> or a plain array of issues.
              </p>
            </div>

            <div className="rounded-lg border border-(--border) bg-[#6f86ff]/5 p-3 text-xs text-(--muted-2)">
              <p className="font-medium text-[#6f86ff] mb-1">How to export from Jira:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Go to your Jira project → Issues → search/filter</li>
                <li>Use the Jira REST API: <code className="bg-(--surface-2) px-1 rounded">GET /rest/api/2/search?jql=project=YOUR_PROJECT</code></li>
                <li>Copy the full JSON response and paste it below</li>
              </ol>
            </div>

            <textarea
              value={jiraJson}
              onChange={(e) => setJiraJson(e.target.value)}
              placeholder={`{\n  "issues": [\n    {\n      "fields": {\n        "summary": "Issue title",\n        "description": "Issue description",\n        "status": { "name": "To Do" },\n        "priority": { "name": "High" }\n      }\n    }\n  ]\n}`}
              className="w-full h-52 rounded-lg border border-(--border) bg-(--surface-2) px-3 py-2 text-sm font-mono resize-none outline-none focus:border-[#6f86ff]/40 transition-colors"
            />

            <button
              onClick={importJira}
              disabled={isImporting || !jiraJson.trim() || !projectId}
              className="h-10 px-5 rounded-lg bg-gradient-to-b from-[#6f86ff] to-[#5a6ee0] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isImporting ? "Importing…" : "Import Jira Issues"}
            </button>
          </div>
        )}

        {/* GitHub Tab */}
        {activeTab === "github" && (
          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Import from GitHub Issues</p>
              <p className="text-xs text-(--muted-2) mt-1">
                Import open issues directly from a GitHub repository. Supports public repos out of the box, and private repos with a personal access token.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-(--muted-2) block mb-1">Repository (owner/repo)</label>
                <input
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="e.g. facebook/react"
                  className="h-10 w-full max-w-md rounded-lg border border-(--border) bg-(--surface-2) px-3 text-sm outline-none focus:border-[#6f86ff]/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-(--muted-2) block mb-1">
                  GitHub Personal Access Token <span className="text-(--muted-2)">(optional, for private repos)</span>
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxx"
                  className="h-10 w-full max-w-md rounded-lg border border-(--border) bg-(--surface-2) px-3 text-sm outline-none focus:border-[#6f86ff]/40 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={importGitHub}
              disabled={isImporting || !githubRepo.trim() || !projectId}
              className="h-10 px-5 rounded-lg bg-gradient-to-b from-[#6f86ff] to-[#5a6ee0] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isImporting ? "Importing…" : "Import GitHub Issues"}
            </button>
          </div>
        )}
      </div>
    </WorkflowLayout>
  );
}
