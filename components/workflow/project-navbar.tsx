"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SVGIcon from "@/lib/svg-icon";
import { RAW_ICONS } from "@/lib/icons";
import { Calendar } from "lucide-react";

type TabDef = {
  label: string;
  segment: string;
  /** Query string including leading ? */
  query?: string;
  icon: "svg" | "calendar";
  svg?: string;
};

const TABS: TabDef[] = [
  { label: "Overview", segment: "", icon: "svg", svg: RAW_ICONS.Docs },
  {
    label: "Incident management",
    segment: "incident-tickets",
    query: "?ticketType=INCIDENT",
    icon: "svg",
    svg: RAW_ICONS.Issue,
  },
  {
    label: "Change management",
    segment: "incident-tickets",
    query: "?ticketType=CHANGE",
    icon: "svg",
    svg: RAW_ICONS.PlannedIssue,
  },
  { label: "Team", segment: "team", icon: "svg", svg: RAW_ICONS.Members },
  { label: "Timeline", segment: "timeline", icon: "calendar" },
  { label: "SLA", segment: "sla", icon: "svg", svg: RAW_ICONS.DashedCircle },
  { label: "Activity", segment: "activity", icon: "svg", svg: RAW_ICONS.Docs },
  { label: "Sprints", segment: "sprints", icon: "svg", svg: RAW_ICONS.PlannedIssue },
  { label: "Backlog", segment: "backlog", icon: "svg", svg: RAW_ICONS.DashedCircle },
  { label: "Board", segment: "board", icon: "svg", svg: RAW_ICONS.Stack },
];

function tabHref(projectId: string, tab: TabDef) {
  const base = `/workflow/project/${projectId}`;
  if (!tab.segment) return base;
  return `${base}/${tab.segment}${tab.query ?? ""}`;
}

function isTabActive(path: string, search: URLSearchParams, projectId: string, tab: TabDef) {
  const base = `/workflow/project/${projectId}`;
  if (!tab.segment) {
    return path === base || path === `${base}/`;
  }
  if (!path.startsWith(`${base}/${tab.segment}`)) return false;
  if (tab.segment === "incident-tickets") {
    const isChangeTab = tab.query?.includes("ticketType=CHANGE");
    const tt = search.get("ticketType");
    if (isChangeTab) return tt === "CHANGE";
    return tt !== "CHANGE";
  }
  return true;
}

export function ProjectNavbar({
  projectId,
  projectTitle,
}: {
  projectId: string | null | undefined;
  projectTitle?: string;
}) {
  const path = usePathname();
  const search = useSearchParams();

  if (!projectId) {
    return (
      <div className="shrink-0 h-10 border-b border-(--border) bg-(--surface-2) px-3 flex items-center text-xs text-(--muted-2)">
        Loading navigation…
      </div>
    );
  }

  const tabClass = (active: boolean) =>
    [
      "shrink-0 inline-flex h-9 items-center gap-1.5 px-2.5 text-[13px] transition-colors duration-150 rounded-md",
      active
        ? "ef-tab-active text-(--foreground)"
        : "text-(--muted) hover:text-(--foreground) hover:bg-(--surface-3)/60",
    ].join(" ");

  return (
    <div className="shrink-0 border-b border-(--border) bg-(--surface-1)">
      <div className="ef-workspace-inner flex h-11 items-stretch gap-1 pr-1">
        <div className="flex items-center gap-2 shrink-0 border-r border-(--border) pr-3 mr-1">
          <Link
            href="/workflow/project"
            className="text-xs font-medium text-(--muted-2) hover:text-(--foreground) transition-colors whitespace-nowrap"
          >
            Projects
          </Link>
          <span className="text-(--muted-2) text-xs opacity-50">/</span>
          <div className="flex h-8 max-w-[200px] lg:max-w-[260px] items-center gap-1.5 rounded-lg bg-(--surface-2) px-2">
            <SVGIcon className="flex w-3.5 h-3.5 shrink-0 text-(--muted-2)" svgString={RAW_ICONS.Cube} />
            <span className="text-[12px] font-medium text-(--foreground) truncate">
              {projectTitle ?? "…"}
            </span>
          </div>
        </div>
        <nav
          className="flex flex-1 min-w-0 items-center gap-0.5 overflow-x-auto scrollbar-hide py-1"
          aria-label="Project areas"
        >
          {TABS.map((tab) => {
            const active = isTabActive(path, search, projectId, tab);
            return (
              <Link
                key={`${tab.segment}-${tab.query ?? tab.label}`}
                href={tabHref(projectId, tab)}
                className={tabClass(active)}
              >
                {tab.icon === "calendar" ? (
                  <Calendar className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
                ) : (
                  <SVGIcon className="flex w-3.5 h-3.5 shrink-0 opacity-80" svgString={tab.svg!} />
                )}
                <span className="whitespace-nowrap">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
