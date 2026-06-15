import type { Metadata } from "next";
import Navbar from "@/components/landing/navbar";
import { siteConfig } from "@/config/site-config";
import { authOptions } from "@/lib/auth";
import { resolveWorkspaceAccess } from "@/lib/workspace-access";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = siteConfig;

export default async function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const access = await resolveWorkspaceAccess(session.user.id, session.user.email);
    if (access.kind === "pending") {
      redirect(`/invite/join?token=${access.token}`);
    }
    if (access.kind === "denied") {
      redirect("/auth/access-denied");
    }
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
