"use client";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import Image from "next/image";
import applogotwo from "@/public/logo.png";
import OptionLabel from "./option-label";
import { BottomOptionsTile } from "./bottom-options-tile";
import { WorkflowTab } from "./workflow-tab";
import { useState } from "react";
import { usePathname } from "next/navigation";

const TabActive =
  "rounded-md bg-(--surface-3) border border-(--border-strong) ";

interface CollapsedState {
  teams: boolean;
  workspace: boolean;
}

export default function WorkflowSidebar() {
  const [workspaceCollapsed, setWorkspaceCollapsed] = useState(false);
  const [featuresCollapsed, setFeaturesCollapsed] = useState(false);

  const pathname = usePathname();

  const toggleWorkspaceCollapse = () => {
    setWorkspaceCollapsed(!workspaceCollapsed);
  };

  const toggleFeatureCollapse = () => {
    setFeaturesCollapsed(!featuresCollapsed);
  };

  const [collapsed, setCollapsed] = useState<CollapsedState>({
    teams: false,
    workspace: false,
  });

  const toggleSection = (section: keyof CollapsedState) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="w-72 min-h-screen hidden md:block px-2 border-r border-(--border) bg-(--surface-1)">
      <WorkflowTab />
      <div className="px-1 mt-2">
        <OptionLabel
          className={pathname === "/workflow/inbox" ? TabActive : ""}
          svg={RAW_ICONS.Inbox}
          optName="Inbox"
          href="/workflow/inbox"
        />
        <OptionLabel
          className={pathname === "/workflow/my-issues" ? TabActive : ""}
          svg={RAW_ICONS.Target}
          optName="My Issues"
          href="/workflow/my-issues"
        />
      </div>
      <div className=" mt-4">
        <div
          className="flex px-3 mb-2 cursor-pointer text-(--muted-2) text-xs uppercase tracking-wide"
          onClick={toggleWorkspaceCollapse}
        >
          <p className="text-xs">Workspace</p>
          <SVGIcon
            className={`flex w-4 transition-transform duration-300 ${
              workspaceCollapsed ? "rotate-180" : "rotate-0"
            }`}
            svgString={RAW_ICONS.ArrowDown}
          />
        </div>
        {/* Workspace Content */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            workspaceCollapsed
              ? "max-h-0 opacity-0"
              : "max-h-[500px] opacity-100"
          }`}
        >
          <div className="space-y-1">
            <OptionLabel
              className={
                pathname.includes("/workflow/project") ? TabActive : ""
              }
              svg={RAW_ICONS.RubiksCube}
              optName="Projects"
              href="/workflow/project"
            />
            <OptionLabel
              className={pathname === "/workflow/members" ? TabActive : ""}
              svg={RAW_ICONS.Members}
              optName="Members"
              href="/workflow/members"
            />
            <OptionLabel
              className={pathname === "/workflow/teams" ? TabActive : ""}
              svg={RAW_ICONS.Team}
              optName="Teams"
              href="/workflow/teams"
            />
          </div>
        </div>
      </div>

      <div className=" mt-4">
        <div className="cursor-pointer" onClick={() => toggleSection("teams")}>
          <div className="flex px-3 mb-2 text-(--muted-2) text-xs uppercase tracking-wide">
            <p className="text-xs">Teams</p>
            <SVGIcon
              className={`flex w-4 transition-transform duration-300 ${
                collapsed.teams ? "rotate-180" : "rotate-0"
              }`}
              svgString={RAW_ICONS.ArrowDown}
            />
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            collapsed.teams ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
          }`}
        >
          {/* Team's Workspace content */}
          <div
            className="flex px-3 cursor-pointer"
            onClick={() => toggleSection("workspace")}
          >
            <Image
              className="h-5 w-5 mr-2"
              src={applogotwo}
              alt="Proj"
              width={100}
              height={100}
            />
            <p className="text-sm">ExporaFlow</p>
            <SVGIcon
              className={`flex w-4 transition-transform duration-300 ${
                collapsed.workspace ? "rotate-180" : "rotate-0"
              }`}
              svgString={RAW_ICONS.ArrowDown}
            />
          </div>

          {/* Workspace Content */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              collapsed.workspace
                ? "max-h-0 opacity-0"
                : "max-h-[500px] opacity-100"
            }`}
          >
            <div className="pl-4">
              <OptionLabel
                className={pathname === "/workflow/my-issues" ? TabActive : ""}
                svg={RAW_ICONS.Target}
                optName="Issues"
                href="/workflow/my-issues"
              />
              <OptionLabel
                className={
                  pathname.includes("/workflow/project") ? TabActive : ""
                }
                svg={RAW_ICONS.RubiksCube}
                optName="Projects"
                href="/workflow/project"
              />
              <OptionLabel
                className={pathname === "/workflow/views" ? TabActive : ""}
                svg={RAW_ICONS.Eye}
                optName="Views"
                href="/workflow/views"
              />
            </div>
          </div>
        </div>
      </div>
      <div className=" mt-4">
        <div
          onClick={toggleFeatureCollapse}
          className="flex px-3 mb-2 cursor-pointer text-(--muted-2) text-xs uppercase tracking-wide"
        >
          <p className="text-xs">Features</p>
          <SVGIcon
            className={`flex w-4 transition-transform duration-300 ${
              featuresCollapsed ? "rotate-180" : "rotate-0"
            }`}
            svgString={RAW_ICONS.ArrowDown}
          />
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            featuresCollapsed
              ? "max-h-0 opacity-0"
              : "max-h-[500px] opacity-100"
          }`}
        >
          <div className="space-y-1">
            <OptionLabel
              className={pathname === "/workflow/github" ? TabActive : ""}
              svg={RAW_ICONS.GitHub}
              optName="GitHub"
              href="/workflow/github"
            />
            <OptionLabel
              className={pathname === "/workflow/import" ? TabActive : ""}
              svg={RAW_ICONS.Target}
              optName="Import Issues"
              href="/workflow/import"
            />
            <OptionLabel
              className={pathname === "/workflow/invite" ? TabActive : ""}
              svg={RAW_ICONS.Members}
              optName="Invite People"
              href="/workflow/invite"
            />
          </div>
        </div>
      </div>
      <BottomOptionsTile />
    </div>
  );
}
