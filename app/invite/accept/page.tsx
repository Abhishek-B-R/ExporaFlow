"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

function AcceptInviteRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) return;
    if (token) {
      router.replace(`/invite/join?token=${encodeURIComponent(token)}`);
    }
  }, [token, error, router]);

  if (error) {
    router.replace(`/invite/join?error=${encodeURIComponent(error)}${token ? `&token=${encodeURIComponent(token)}` : ""}`);
    return null;
  }

  return (
    <AuthShell kicker="Invitation" title="One moment…" lead="Redirecting you to join.">
      <div className="flex justify-center py-2">
        <div className="h-10 w-10 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      </div>
    </AuthShell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <AuthShell kicker="Invitation" title="One moment…">
          <div className="flex justify-center py-4">
            <div className="h-10 w-10 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          </div>
        </AuthShell>
      }
    >
      <AcceptInviteRedirect />
    </Suspense>
  );
}
