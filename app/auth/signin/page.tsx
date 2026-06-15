"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthDivider,
  CredentialsForm,
  OAuthProviders,
} from "@/components/auth/credentials-auth";
import { getWorkspaceOwnerEmail } from "@/lib/workspace-access";
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
          : "Sign in with your email and password, or continue with Google or GitHub."
      }
    >
      <div className="space-y-4">
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

        <CredentialsForm mode="signin" callbackUrl={callbackUrl} />

        <AuthDivider />

        <OAuthProviders callbackUrl={callbackUrl} />

        <p className="text-[11px] text-center text-(--muted-2) leading-relaxed">
          Invited teammates can also open the link in your invite email.
        </p>

        <p className="text-xs text-center text-(--muted-2)">
          No account yet?{" "}
          <Link href="/signup" className="text-sky-700 hover:underline font-medium">
            Create one
          </Link>
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
