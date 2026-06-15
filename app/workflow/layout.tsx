import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getPendingInvitationForEmail,
  isWorkspaceMember,
} from "@/lib/workspace-access";
import WorkflowSidebar from "@/components/workflow/sidebar/workflow-sidebar";
import BottomDock from "@/components/workflow/sidebar/bottom-dock";
import CommandPalette from "@/components/workflow/command-palette";

export const metadata: Metadata = {
  title: "ExporaFlow",
  description: "Workflow",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/workflow/dashboard");
  }

  const member = await isWorkspaceMember(session.user.id);
  if (!member) {
    const email = session.user.email;
    if (email) {
      const pending = await getPendingInvitationForEmail(email);
      if (pending) {
        redirect(`/invite/accept?token=${pending.token}`);
      }
    }
    redirect("/auth/access-denied");
  }

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
