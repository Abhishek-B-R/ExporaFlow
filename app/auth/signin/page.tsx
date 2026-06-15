"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { getWorkspaceOwnerEmail } from "@/lib/workspace-access";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SignInContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const hasCallbackError = error === "Callback";
  const accessDenied = error === "AccessDenied" || params.get("access") === "denied";
  const callbackUrl = params.get("callbackUrl") ?? "/workflow/dashboard";
  const adminEmail = getWorkspaceOwnerEmail();

  return (
    <AuthShell
      kicker="Workspace"
      title="Sign in"
      lead={
        accessDenied
          ? "This account isn't on the invite list. Use the link from your invite email, or ask the admin below."
          : "For the workspace owner and teammates who prefer Google or GitHub."
      }
    >
      <div className="space-y-3">
        {hasCallbackError ? (
          <p className="text-sm text-red-600 text-center rounded-lg bg-red-50 border border-red-100 px-3 py-2">
            Sign-in failed. Check your connection and try again.
          </p>
        ) : null}

        {accessDenied && adminEmail ? (
          <p className="text-xs text-center text-(--muted-2)">
            Need access?{" "}
            <a
              href={`mailto:${adminEmail}`}
              className="text-sky-700 hover:underline font-medium"
            >
              Email {adminEmail}
            </a>
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full h-11 rounded-xl border border-(--border) bg-(--surface-1) hover:bg-(--surface-2) text-sm font-medium flex items-center justify-center gap-2.5 transition-colors shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl })}
          className="w-full h-11 rounded-xl bg-[#24292f] hover:bg-[#1b1f23] text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Continue with GitHub
        </button>

        <p className="text-[11px] text-center text-(--muted-2) pt-2 leading-relaxed">
          Invited teammates can skip this — open the link in your invite email instead.
        </p>

        <Link
          href="/"
          className="block text-center text-xs text-(--muted-2) hover:text-(--foreground) pt-1"
        >
          ← Back to home
        </Link>
      </div>
    </AuthShell>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <AuthShell kicker="Workspace" title="Sign in">
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          </div>
        </AuthShell>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
