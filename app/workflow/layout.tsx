import React from "react";
import type { Metadata } from "next";
import WorkflowSidebar from "@/components/workflow/sidebar/workflow-sidebar";
import BottomDock from "@/components/workflow/sidebar/bottom-dock";
import CommandPalette from "@/components/workflow/command-palette";

export const metadata: Metadata = {
  title: "ExporaFlow",
  description: "Workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-(--background)">
        <WorkflowSidebar />
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
      <CommandPalette />
      <BottomDock />
    </>
  );
}
