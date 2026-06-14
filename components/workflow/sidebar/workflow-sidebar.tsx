"use client";

import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import OptionLabel from "./option-label";
import { WorkflowTab } from "./workflow-tab";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Inbox,
  ListTodo,
  Boxes,
  Eye,
  Tag,
  UsersRound,
  Users,
  UserCircle2,
  Github,
  Download,
  UserPlus,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navActive = "ef-nav-active";

function SectionHeader({
  title,
  collapsed,
  onToggle,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full px-2 py-1 mb-0.5 items-center justify-between cursor-pointer text-(--muted-2) hover:text-(--muted) transition-colors rounded-md hover:bg-(--surface-2)/60"
    >
      <span className="text-xs font-medium text-(--muted-2)">{title}</span>
      <SVGIcon
        className={`flex w-3.5 h-3.5 shrink-0 text-(--muted-2) transition-transform duration-200 ${
          collapsed ? "-rotate-90" : "rotate-0"
        }`}
        svgString={RAW_ICONS.ArrowDown}
      />
    </button>
  );
}

function Collapsible({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
        collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
      }`}
    >
      <div className="overflow-hidden min-h-0">
        <div className="space-y-px pl-1.5 ml-1 border-l border-(--border) py-0.5">{children}</div>
      </div>
    </div>
  );
}

export default function WorkflowSidebar() {
  const pathname = usePathname();

  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [storeOpen, setStoreOpen] = useState(true);
  const [featuresOpen, setFeaturesOpen] = useState(true);

  const inStore = pathname.startsWith("/workflow/store");
  const projectsNavActive =
    pathname === "/workflow/project" || pathname.startsWith("/workflow/project/");

  return (
    <aside className="w-[220px] lg:w-56 min-h-0 h-full hidden md:flex flex-col border-r border-(--border) bg-(--surface-1)">
      <WorkflowTab />

      <nav className="px-1.5 pt-2 pb-1.5 space-y-px shrink-0 border-b border-(--border)/80">
        <OptionLabel
          className={pathname === "/workflow/dashboard" ? navActive : ""}
          Lucide={LayoutDashboard}
          optName="Dashboard"
          href="/workflow/dashboard"
        />
        <OptionLabel
          className={pathname === "/workflow/inbox" ? navActive : ""}
          Lucide={Inbox}
          optName="Inbox"
          href="/workflow/inbox"
        />
        <OptionLabel
          className={pathname === "/workflow/my-issues" ? navActive : ""}
          Lucide={ListTodo}
          optName="My tickets"
          href="/workflow/my-issues"
        />
      </nav>

      <div className="flex-1 min-h-0 flex flex-col gap-0 overflow-y-auto scrollbar-hide py-2 px-1.5">
        <SectionHeader
          title="Workspace"
          collapsed={!workspaceOpen}
          onToggle={() => setWorkspaceOpen((v) => !v)}
        />
        <Collapsible collapsed={!workspaceOpen}>
          <OptionLabel
            className={projectsNavActive ? navActive : ""}
            Lucide={Boxes}
            optName="Projects"
            href="/workflow/project"
          />
          <OptionLabel
            className={pathname === "/workflow/views" ? navActive : ""}
            Lucide={Eye}
            optName="Views"
            href="/workflow/views"
          />
          <OptionLabel
            className={pathname === "/workflow/labels" ? navActive : ""}
            Lucide={Tag}
            optName="Labels"
            href="/workflow/labels"
          />
        </Collapsible>

        <div className="my-2 h-px bg-(--border) mx-1" />

        <SectionHeader
          title="People"
          collapsed={!peopleOpen}
          onToggle={() => setPeopleOpen((v) => !v)}
        />
        <Collapsible collapsed={!peopleOpen}>
          <OptionLabel
            className={pathname === "/workflow/members" ? navActive : ""}
            Lucide={UsersRound}
            optName="Members"
            href="/workflow/members"
          />
          <OptionLabel
            className={pathname === "/workflow/teams" ? navActive : ""}
            Lucide={Users}
            optName="Teams"
            href="/workflow/teams"
          />
        </Collapsible>

        <div className="my-2 h-px bg-(--border) mx-1" />

        <SectionHeader
          title="Store"
          collapsed={!storeOpen}
          onToggle={() => setStoreOpen((v) => !v)}
        />
        <Collapsible collapsed={!storeOpen}>
          <OptionLabel
            className={inStore && pathname.includes("/customers") ? navActive : ""}
            Lucide={Building2}
            optName="Customers"
            href="/workflow/store/customers"
          />
          <OptionLabel
            className={inStore && pathname.includes("/employees") ? navActive : ""}
            Lucide={UserCircle2}
            optName="Employees"
            href="/workflow/store/employees"
          />
        </Collapsible>

        <div className="my-2 h-px bg-(--border) mx-1" />

        <SectionHeader
          title="Features"
          collapsed={!featuresOpen}
          onToggle={() => setFeaturesOpen((v) => !v)}
        />
        <Collapsible collapsed={!featuresOpen}>
          <OptionLabel
            className={pathname === "/workflow/github" ? navActive : ""}
            Lucide={Github}
            optName="GitHub"
            href="/workflow/github"
          />
          <OptionLabel
            className={pathname === "/workflow/import" ? navActive : ""}
            Lucide={Download}
            optName="Import tickets"
            href="/workflow/import"
          />
          <OptionLabel
            className={pathname === "/workflow/invite" ? navActive : ""}
            Lucide={UserPlus}
            optName="Invite people"
            href="/workflow/invite"
          />
        </Collapsible>
      </div>

      <div className="mt-auto pt-1.5 pb-2 px-1.5 border-t border-(--border) bg-(--surface-1) shrink-0">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 h-9 px-2.5 rounded-lg text-sm font-medium text-(--muted) hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
