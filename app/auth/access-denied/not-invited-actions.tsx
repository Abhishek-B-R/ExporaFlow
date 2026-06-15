"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function NotInvitedActions({ adminEmail }: { adminEmail: string | null }) {
  return (
    <div className="flex flex-col gap-3">
      {adminEmail ? (
        <a
          href={`mailto:${adminEmail}?subject=${encodeURIComponent("ExporaFlow access request")}&body=${encodeURIComponent("Hi,\n\nI'd like to be invited to ExporaFlow. My email is:\n\n")}`}
          className="h-11 rounded-xl ef-btn-primary text-sm font-medium inline-flex items-center justify-center gap-2"
        >
          Email admin
        </a>
      ) : null}
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="h-11 rounded-xl border border-(--border) text-sm font-medium hover:bg-(--surface-2) transition-colors"
      >
        Sign out
      </button>
      <Link
        href="/"
        className="text-xs text-center text-(--muted-2) hover:text-(--foreground) transition-colors pt-1"
      >
        ← Back to home
      </Link>
    </div>
  );
}
