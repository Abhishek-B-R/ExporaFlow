import SVGIcon from "@/lib/svg-icon";
import React, { ReactNode } from "react";

interface WrapperProps {
  children: ReactNode;
  windowTitle: string;
  windowSvg: string;
}

export const WorkflowLayout: React.FC<WrapperProps> = ({
  children,
  windowTitle,
  windowSvg,
}) => {
  return (
    <div className="w-full h-screen flex flex-col bg-(--background)">
      <div className="h-12 px-4 flex items-center justify-between border-b border-(--border)">
        <div className="flex items-center gap-x-2">
          <SVGIcon className="flex w-4" svgString={windowSvg} />
          <p className="text-sm font-medium">{windowTitle}</p>
        </div>
        <p className="hidden md:block text-xs text-(--muted-2)">
          Press <span className="px-1 py-0.5 rounded bg-(--surface-3)">⌘K</span> for commands
        </p>
      </div>
      <div className="flex-grow m-2 md:ml-0 linear-panel overflow-hidden">
        {children}
      </div>
    </div>
  );
};
