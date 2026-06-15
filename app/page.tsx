import Landing from "@/components/landing/landing";
import Navbar from "@/components/landing/navbar";
import { authOptions } from "@/lib/auth";
import { resolveWorkspaceAccess } from "@/lib/workspace-access";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Home() {
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
      <Landing />
    </>
  );
}
