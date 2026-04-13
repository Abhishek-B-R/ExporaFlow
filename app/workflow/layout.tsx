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
      <div className="flex">
        <WorkflowSidebar />
        {children}
      </div>
      <CommandPalette />
      <BottomDock />
    </>
  );
}
