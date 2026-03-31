"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import Link from "next/link";

const savedViews = [
  { name: "My Open Work", href: "/workflow/my-issues", description: "Assigned + active issues" },
  { name: "Project Backlog", href: "/workflow/project", description: "Browse backlog by project" },
  { name: "Sprint Board", href: "/workflow/project", description: "Monitor in-progress sprint work" },
];

export default function ViewsPage() {
  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Eye} windowTitle="Views">
      <div className="p-4">
        <p className="text-lg font-medium mb-3">Saved views</p>
        <div className="space-y-2">
          {savedViews.map((view) => (
            <Link
              key={view.name}
              href={view.href}
              className="block rounded-lg border border-(--border) bg-(--surface-1) hover:bg-(--surface-2) px-3 py-2 transition-colors"
            >
              <p className="text-sm">{view.name}</p>
              <p className="text-xs text-(--muted-2) mt-1">{view.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </WorkflowLayout>
  );
}

