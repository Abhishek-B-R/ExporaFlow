import SVGIcon from "@/lib/svg-icon";
import React, { ReactNode } from "react";

interface WrapperProps {
  children: ReactNode;
  windowTitle: string;
  windowSvg: string;
  /** Optional breadcrumb trail (e.g. workspace / area / page) */
  breadcrumb?: ReactNode;
  /** Optional right-side actions (buttons, menus) */
  actions?: ReactNode;
}

export const WorkflowLayout: React.FC<WrapperProps> = ({
  children,
  windowTitle,
  windowSvg,
  breadcrumb,
  actions,
}) => {
  return (
    <div className="w-full flex-1 min-h-0 min-w-0 flex flex-col bg-(--background) text-(--foreground)">
      <header className="h-11 shrink-0 flex items-center justify-between gap-4 px-3 md:px-4 border-b border-(--border) bg-(--surface-1)">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {breadcrumb ? (
            <div className="hidden sm:flex items-center gap-2 text-xs text-(--muted-2) min-w-0 shrink">
              {breadcrumb}
            </div>
          ) : null}
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex shrink-0 text-(--muted-2) [&>div]:flex">
              <SVGIcon className="flex w-4 h-4" svgString={windowSvg} />
            </span>
            <div className="min-w-0 flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-(--foreground) truncate">
                {windowTitle}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <span className="hidden md:inline text-[11px] text-(--muted-2) tabular-nums">
            <kbd className="px-1.5 py-0.5 rounded border border-(--border) bg-(--surface-2) text-(--muted) font-mono text-[10px]">
              ⌘K
            </kbd>
            <span className="ml-1.5">Commands</span>
          </span>
        </div>
      </header>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-2 md:pl-0 md:pr-2 md:pb-2 pb-16 md:pt-1.5">
        <div className="linear-panel flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
