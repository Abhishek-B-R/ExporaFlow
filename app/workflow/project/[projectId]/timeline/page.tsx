"use client";

import { useParams } from "next/navigation";
import { ProjectSubpageFrame } from "@/components/workflow/project-subpage-frame";

export default function ProjectTimelinePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  return (
    <ProjectSubpageFrame
      projectId={projectId}
      pageHeading="Timeline"
      pageSubheading="Milestones and delivery timeline for this engagement will appear here."
    >
      <div className="rounded-md border border-dashed border-(--border) bg-(--surface-2)/40 px-4 py-8 text-center text-sm text-(--muted-2)">
        Timeline views are not configured yet. Work continues in{" "}
        <span className="text-(--muted)">Sprints</span> and{" "}
        <span className="text-(--muted)">Overview</span> for now.
      </div>
    </ProjectSubpageFrame>
  );
}
