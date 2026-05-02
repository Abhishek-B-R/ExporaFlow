"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SVGIcon from "@/lib/svg-icon";
import { RAW_ICONS } from "@/lib/icons";

const TABS = [
  { label: "Overview", icon: RAW_ICONS.Docs, segment: "" },
  { label: "Issues", icon: RAW_ICONS.Issue, segment: "issues" },
  { label: "Sprints", icon: RAW_ICONS.PlannedIssue, segment: "sprints" },
  { label: "Backlog", icon: RAW_ICONS.DashedCircle, segment: "backlog" },
  { label: "Board", icon: RAW_ICONS.Stack, segment: "board" },
] as const;

export function ProjectNavbar({
  projectId,
  projectTitle,
}: {
  projectId: string | null | undefined;
  projectTitle?: string;
}) {
  const path = usePathname();

  // Determine the active segment from the URL
  const basePath = `/workflow/project/${projectId}`;
  const suffix = path.replace(basePath, "").replace(/^\//, "").split("/")[0] ?? "";
  const activeSegment = TABS.some((t) => t.segment === suffix) ? suffix : "";

  const tabClass = (segment: string) =>
    segment === activeSegment
      ? "flex h-7 items-center gap-x-1 cursor-pointer border border-[#4a4f5a] px-2 rounded-md bg-[#1e2028] text-white transition-all duration-300"
      : "flex h-7 items-center gap-x-1 cursor-pointer border border-(--border) px-2 rounded-md bg-transparent text-[#8a8d93] hover:bg-(--surface-2) hover:text-[#c5c7cb] transition-all duration-300";

  return (
    <div className="border-b border-(--border) h-10 flex items-center justify-between px-4 bg-(--surface-2)">
      <div className="flex gap-x-2 items-center">
        <Link
          href="/workflow/project"
          className="flex items-center rounded text-[12px] sm:text-[13px] md:text-[15px] border border-transparent hover:border-[#2E3035] px-2 h-7 hover:bg-[#1C1D21] transition-all duration-300"
        >
          Projects
        </Link>
        <div className="flex h-7 items-center gap-x-1 cursor-pointer border border-(--border) px-2 rounded-md hover:bg-(--surface-3) transition-all duration-300">
          <SVGIcon className="flex w-4" svgString={RAW_ICONS.Cube} />
          <p className="text-[12px] sm:text-[13px] md:text-[15px]">
            {projectTitle ?? "Loading…"}
          </p>
        </div>
        {TABS.map((tab) => (
          <Link
            key={tab.segment}
            href={tab.segment ? `${basePath}/${tab.segment}` : basePath}
            className={tabClass(tab.segment)}
          >
            <SVGIcon className="flex w-4" svgString={tab.icon} />
            <p className="text-[12px] sm:text-[13px] md:text-[15px]">{tab.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
