"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function WelcomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspace = searchParams.get("workspace") ?? "your workspace";
  const role = searchParams.get("role") ?? "";
  const isNew = searchParams.get("new") !== "0";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/workflow/dashboard");
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <AuthShell
      kicker={isNew ? "You're in" : "Welcome back"}
      title={isNew ? `Welcome to ${workspace}` : `Good to see you again`}
      lead={
        role
          ? `You're signed in as ${roleLabel(role)}. Taking you to your dashboard…`
          : "Taking you to your dashboard…"
      }
    >
      <div className="flex flex-col items-center text-center gap-5">
        <div className="ef-auth-check-pop flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M8 12.5L10.5 15L16 9"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="w-full h-1 rounded-full bg-(--surface-3) overflow-hidden">
          <div className="h-full rounded-full bg-linear-to-r from-emerald-400 to-sky-500 ef-auth-progress-bar" />
        </div>
        <Link
          href="/workflow/dashboard"
          className="text-sm text-sky-700 hover:underline font-medium"
        >
          Go now →
        </Link>
      </div>
    </AuthShell>
  );
}

export default function InviteWelcomePage() {
  return (
    <Suspense
      fallback={
        <AuthShell kicker="Welcome" title="Almost there…">
          <div className="flex justify-center py-6">
            <div className="h-10 w-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          </div>
        </AuthShell>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
