"use client";

import { useParams } from "next/navigation";
import { ProjectSubpageFrame } from "@/components/workflow/project-subpage-frame";

export default function ProjectActivityPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  return (
    <ProjectSubpageFrame
      projectId={projectId}
      pageHeading="Activity"
      pageSubheading="Audit trail of project updates, ticket transitions, and configuration changes."
    >
      <div className="rounded-md border border-dashed border-(--border) bg-(--surface-2)/40 px-4 py-8 text-center text-sm text-(--muted-2)">
        Centralized activity feed is planned. Ticket comments and history remain available on each
        work item.
      </div>
    </ProjectSubpageFrame>
  );
}
