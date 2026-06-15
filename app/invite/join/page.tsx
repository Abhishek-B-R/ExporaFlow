"use client";

import { AuthShell, AuthStepList } from "@/components/auth/auth-shell";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const STEPS = [
  "Verifying your invitation",
  "Setting up your account",
  "Signing you in",
];

function JoinInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(
    errorParam ? decodeURIComponent(errorParam) : null,
  );

  useEffect(() => {
    if (!token || error) return;

    let cancelled = false;

    const run = async () => {
      setStepIndex(0);
      await new Promise((r) => setTimeout(r, 450));
      if (cancelled) return;
      setStepIndex(1);
      await new Promise((r) => setTimeout(r, 350));
      if (cancelled) return;

      try {
        const res = await fetch("/api/invite/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.message ?? "Could not accept this invitation.");
          return;
        }

        setStepIndex(2);
        await new Promise((r) => setTimeout(r, 500));
        if (cancelled) return;

        if (data.redirectUrl) {
          router.replace(data.redirectUrl);
        } else {
          router.replace("/workflow/dashboard");
        }
      } catch {
        if (!cancelled) {
          setError("Something went wrong. Please try your invite link again.");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [token, error, router]);

  if (error) {
    return (
      <AuthShell
        kicker="Invitation"
        title="We couldn't complete your invite"
        lead={error}
      >
        <div className="flex flex-col gap-3">
          {token ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                window.location.href = `/invite/join?token=${encodeURIComponent(token)}`;
              }}
              className="h-11 rounded-xl ef-btn-primary text-sm font-medium"
            >
              Try again
            </button>
          ) : null}
          <Link
            href="/auth/signin"
            className="h-11 rounded-xl border border-(--border) text-sm font-medium inline-flex items-center justify-center hover:bg-(--surface-2) transition-colors"
          >
            Sign in instead
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (!token) {
    return (
      <AuthShell
        kicker="Invitation"
        title="Invalid link"
        lead="Open the link from your invite email, or ask your admin to resend it."
      >
        <Link
          href="/"
          className="block text-center text-sm text-sky-700 hover:underline"
        >
          Back to home
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Welcome"
      title="Getting you in…"
      lead="No password or Google sign-in needed — your invite link handles everything."
    >
      <AuthStepList steps={STEPS} activeIndex={stepIndex} />
      <div className="mt-6 h-1 rounded-full bg-(--surface-3) overflow-hidden">
        <div
          className="h-full rounded-full bg-linear-to-r from-sky-400 to-sky-600 transition-all duration-500 ease-out"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </AuthShell>
  );
}

export default function JoinInvitePage() {
  return (
    <Suspense
      fallback={
        <AuthShell kicker="Welcome" title="Getting you in…">
          <div className="flex justify-center py-4">
            <div className="h-10 w-10 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          </div>
        </AuthShell>
      }
    >
      <JoinInviteContent />
    </Suspense>
  );
}
