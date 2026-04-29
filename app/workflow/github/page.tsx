"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

type RecentActivity = {
  id: string;
  action: string;
  createdAt: string;
  issue?: { id: string; title: string } | null;
  project?: { id: string; title: string } | null;
};

export default function GitHubPage() {
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    // Check GitHub account connection
    axios
      .get("/api/import/github/status")
      .then((res) => setGithubConnected(res.data?.connected ?? false))
      .catch(() => setGithubConnected(false));

    // Build webhook URL
    const base =
      typeof window !== "undefined" ? window.location.origin : "";
    setWebhookUrl(`${base}/api/integrations/github`);

    // Fetch recent GitHub-related activity
    axios
      .get("/api/notifications?type=github&limit=10")
      .then((res) => {
        setActivities(Array.isArray(res.data) ? res.data.slice(0, 10) : []);
      })
      .catch(() => {})
      .finally(() => setIsLoadingActivities(false));
  }, []);

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      customToast.success({
        title: "",
        description: "Webhook URL copied to clipboard.",
      });
    } catch {
      customToast.error({
        title: "",
        description: "Failed to copy URL.",
      });
    }
  };

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.GitHub} windowTitle="GitHub">
      <div className="grow overflow-y-auto px-4 md:px-6 py-5 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-medium">GitHub Integration</h1>
          <p className="text-sm text-(--muted-2) mt-1">
            Connect repositories, import issues, and link pull requests & commits to your ExporaFlow workflow.
          </p>
        </div>

        {/* Connection Status */}
        <div
          className={`rounded-xl border p-4 flex items-center gap-4 ${
            githubConnected
              ? "border-[#30b27a]/30 bg-[#30b27a]/5"
              : githubConnected === false
                ? "border-[#e5a63b]/30 bg-[#e5a63b]/5"
                : "border-(--border) bg-(--surface-1)"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              githubConnected
                ? "bg-[#30b27a]/20"
                : githubConnected === false
                  ? "bg-[#e5a63b]/20"
                  : "bg-(--surface-3)"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={
                githubConnected
                  ? "text-[#30b27a]"
                  : githubConnected === false
                    ? "text-[#e5a63b]"
                    : "text-(--muted-2)"
              }
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
          <div className="flex-1">
            {githubConnected === null ? (
              <p className="text-sm text-(--muted-2)">Checking GitHub connection…</p>
            ) : githubConnected ? (
              <>
                <p className="text-sm font-medium text-[#30b27a]">GitHub account connected</p>
                <p className="text-xs text-(--muted-2) mt-0.5">
                  You can import issues from private repos and your commits/PRs will be linked to your identity.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[#e5a63b]">GitHub account not linked</p>
                <p className="text-xs text-(--muted-2) mt-0.5">
                  Sign in with GitHub to access private repositories and link your identity.
                  You can still use webhooks and import from public repos.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            href="/workflow/import"
            className="rounded-xl border border-(--border) bg-(--surface-1) p-4 hover:bg-(--surface-2) transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#6f86ff]/15 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6f86ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <p className="text-sm font-medium group-hover:text-[#6f86ff] transition-colors">
                Import Issues
              </p>
            </div>
            <p className="text-xs text-(--muted-2)">
              Pull open issues from any GitHub repository directly into your projects.
            </p>
          </Link>

          <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/15 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 00-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 004 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </div>
              <p className="text-sm font-medium">Link PRs & Commits</p>
            </div>
            <p className="text-xs text-(--muted-2)">
              Reference ExporaFlow issues in your commit messages or PR descriptions using the issue ID (e.g.{" "}
              <code className="bg-(--surface-3) px-1 rounded text-[#a78bfa]">EXP-abc123</code>) to auto-link them.
            </p>
          </div>
        </div>

        {/* Webhook Setup */}
        <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Webhook Setup</p>
            <p className="text-xs text-(--muted-2) mt-1">
              Add this webhook URL to your GitHub repository to automatically link pull requests and commits to issues.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 rounded-lg border border-(--border) bg-(--surface-2) px-3 flex items-center overflow-hidden">
              <code className="text-xs text-(--muted-2) truncate">{webhookUrl || "Loading…"}</code>
            </div>
            <button
              onClick={copyWebhookUrl}
              className="h-10 px-4 rounded-lg border border-(--border) bg-(--surface-2) hover:bg-(--surface-3) text-sm transition-colors shrink-0"
            >
              Copy
            </button>
          </div>

          <div className="rounded-lg border border-(--border) bg-[#6f86ff]/5 p-3 text-xs space-y-2">
            <p className="font-medium text-[#6f86ff]">Setup instructions</p>
            <ol className="list-decimal list-inside space-y-1 text-(--muted-2)">
              <li>
                Go to your GitHub repo → <strong className="text-(--muted-1)">Settings → Webhooks → Add webhook</strong>
              </li>
              <li>
                Paste the webhook URL above into the <strong className="text-(--muted-1)">Payload URL</strong> field
              </li>
              <li>
                Set <strong className="text-(--muted-1)">Content type</strong> to{" "}
                <code className="bg-(--surface-3) px-1 rounded">application/json</code>
              </li>
              <li>
                Under <strong className="text-(--muted-1)">events</strong>, select{" "}
                <code className="bg-(--surface-3) px-1 rounded">Pull requests</code> and{" "}
                <code className="bg-(--surface-3) px-1 rounded">Pushes</code>
              </li>
              <li>Click <strong className="text-(--muted-1)">Add webhook</strong></li>
            </ol>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-3">
          <div>
            <p className="text-sm font-medium">Recent Activity</p>
            <p className="text-xs text-(--muted-2) mt-1">
              Latest webhook events and linked commits/PRs.
            </p>
          </div>
          <div className="space-y-2">
            {isLoadingActivities ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg border border-(--border) bg-(--surface-2) px-3 py-3 animate-pulse">
                    <div className="h-3.5 bg-(--surface-3) rounded w-2/3 mb-2" />
                    <div className="h-2.5 bg-(--surface-3) rounded w-1/3" />
                  </div>
                ))}
              </>
            ) : activities.length > 0 ? (
              activities.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-(--border) bg-(--surface-2) px-3 py-2"
                >
                  <p className="text-sm">{a.action}</p>
                  <p className="text-xs text-(--muted-2) mt-1">
                    {a.issue?.title ?? a.project?.title ?? "—"} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-(--surface-3) mx-auto mb-3 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-(--muted-2)">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-(--muted-2)">No activity yet</p>
                <p className="text-xs text-(--muted-2) mt-1">
                  Set up the webhook above to start linking PRs and commits.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </WorkflowLayout>
  );
}
