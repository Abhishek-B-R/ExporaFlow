"use client";

import { useParams } from "next/navigation";
import { ProjectSubpageFrame } from "@/components/workflow/project-subpage-frame";

export default function ProjectSlaPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  return (
    <ProjectSubpageFrame
      projectId={projectId}
      pageHeading="SLA"
      pageSubheading="Service level targets, breach risk, and pause windows (e.g. Hold on change tickets)."
    >
      <div className="rounded-md border border-dashed border-(--border) bg-(--surface-2)/40 px-4 py-8 text-center text-sm text-(--muted-2)">
        SLA analytics will aggregate from ticket-level deadlines. Use{" "}
        <span className="text-(--muted)">Incidents</span> and{" "}
        <span className="text-(--muted)">Changes</span> for per-item SLA fields.
      </div>
    </ProjectSubpageFrame>
  );
}
