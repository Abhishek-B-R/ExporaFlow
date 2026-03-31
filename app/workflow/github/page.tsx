"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";

export default function GitHubPage() {
  return (
    <WorkflowLayout windowSvg={RAW_ICONS.GitHub} windowTitle="GitHub">
      <div className="p-4">
        <p className="text-lg font-medium mb-2">GitHub Integration</p>
        <p className="text-sm text-(--muted-2)">
          Connect repositories and map pull requests to issues.
        </p>
        <div className="mt-4 rounded-lg border border-(--border) bg-(--surface-1) p-3">
          <p className="text-sm">Setup checklist</p>
          <ul className="mt-2 text-xs text-(--muted-2) space-y-1">
            <li>- Create webhook in your repository</li>
            <li>- Point it to your backend integration endpoint</li>
            <li>- Verify PR and commit references sync to issues</li>
          </ul>
        </div>
      </div>
    </WorkflowLayout>
  );
}

