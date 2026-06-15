import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  children,
  kicker,
  title,
  lead,
  maxWidth = "md",
}: {
  children: ReactNode;
  kicker?: string;
  title?: string;
  lead?: string;
  maxWidth?: "sm" | "md" | "lg";
}) {
  const widthClass =
    maxWidth === "sm" ? "max-w-sm" : maxWidth === "lg" ? "max-w-lg" : "max-w-md";

  return (
    <div className="ef-auth-scene min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="ef-auth-orb ef-auth-orb-a" aria-hidden />
      <div className="ef-auth-orb ef-auth-orb-b" aria-hidden />

      <Link
        href="/"
        className="relative z-10 flex items-center gap-2.5 mb-8 opacity-90 hover:opacity-100 transition-opacity"
      >
        <Image src="/logo.png" alt="ExporaFlow" width={36} height={36} className="size-9" />
        <span className="text-[15px] font-semibold tracking-tight text-(--foreground)">
          ExporaFlow
        </span>
      </Link>

      <div className={`relative z-10 w-full ${widthClass}`}>
        {(kicker || title || lead) && (
          <div className="text-center mb-6">
            {kicker ? (
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 mb-2">
                {kicker}
              </p>
            ) : null}
            {title ? (
              <h1 className="text-2xl font-semibold tracking-tight text-(--foreground)">
                {title}
              </h1>
            ) : null}
            {lead ? (
              <p className="text-sm text-(--muted-2) mt-2 leading-relaxed">{lead}</p>
            ) : null}
          </div>
        )}
        <div className="ef-auth-card rounded-2xl border border-(--border) bg-(--surface-1)/95 backdrop-blur-sm p-8 shadow-[var(--elevated-shadow)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthStepList({
  steps,
  activeIndex,
}: {
  steps: string[];
  activeIndex: number;
}) {
  return (
    <ul className="space-y-3 text-left">
      {steps.map((label, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <li
            key={label}
            className={`flex items-center gap-3 text-sm transition-all duration-500 ${
              done
                ? "text-emerald-700"
                : active
                  ? "text-(--foreground) font-medium"
                  : "text-(--muted-2)"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-500 ${
                done
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : active
                    ? "border-sky-300 bg-sky-50 text-sky-700 ef-auth-pulse"
                    : "border-(--border) bg-(--surface-2) text-(--muted-2)"
              }`}
            >
              {done ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
