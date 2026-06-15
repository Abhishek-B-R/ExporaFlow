"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthDivider,
  CredentialsForm,
  OAuthProviders,
} from "@/components/auth/credentials-auth";
import { getWorkspaceOwnerEmail } from "@/lib/workspace-access";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useSession } from "@/utils/auth";

function SignUpContent() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/workflow/dashboard";
  const adminEmail = getWorkspaceOwnerEmail();
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.workspaceMember) {
      router.replace("/workflow/dashboard");
    }
  }, [session?.user?.workspaceMember, router]);

  return (
    <AuthShell
      kicker="Get started"
      title="Create your account"
      lead="Use the email your admin invited. You'll join the workspace automatically when you sign up."
    >
      <div className="space-y-4">
        <CredentialsForm mode="signup" callbackUrl={callbackUrl} />

        <AuthDivider />

        <OAuthProviders callbackUrl={callbackUrl} />

        {adminEmail ? (
          <p className="text-[11px] text-center text-(--muted-2) leading-relaxed">
            Not invited yet? Ask{" "}
            <a href={`mailto:${adminEmail}`} className="text-sky-700 hover:underline font-medium">
              {adminEmail}
            </a>{" "}
            for access.
          </p>
        ) : null}

        <p className="text-xs text-center text-(--muted-2)">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-sky-700 hover:underline font-medium">
            Sign in
          </Link>
        </p>

        <p className="text-[11px] text-center text-(--muted-2) leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-sky-700 hover:underline">
            terms
          </Link>
          .
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

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <AuthShell kicker="Get started" title="Create your account">
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          </div>
        </AuthShell>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
