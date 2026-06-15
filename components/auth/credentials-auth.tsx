"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function AuthDivider({ label = "or continue with" }: { label?: string }) {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-(--border)" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-(--surface-1) px-3 text-[11px] font-medium uppercase tracking-wider text-(--muted-2)">
          {label}
        </span>
      </div>
    </div>
  );
}

export function OAuthProviders({
  callbackUrl = "/workflow/dashboard",
}: {
  callbackUrl?: string;
}) {
  return (
    <div className="space-y-2.5">
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
        Google
      </button>
      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl })}
        className="w-full h-11 rounded-xl bg-[#24292f] hover:bg-[#1b1f23] text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        GitHub
      </button>
    </div>
  );
}

const inputClass =
  "w-full h-11 rounded-xl border border-(--border) bg-(--surface-2) px-3.5 text-sm outline-none transition-colors placeholder:text-(--muted-2) focus:border-sky-400/60 focus:bg-(--surface-1)";

export function CredentialsForm({
  mode,
  callbackUrl = "/workflow/dashboard",
}: {
  mode: "signin" | "signup";
  callbackUrl?: string;
}) {
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/register" : "/api/auth/login";
      const body = isSignup
        ? { name, email, password, confirmPassword }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message ?? "Something went wrong. Try again.");
        return;
      }

      window.location.href = data.redirectUrl ?? callbackUrl;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {error ? (
        <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
          {error}
        </p>
      ) : null}

      {isSignup ? (
        <div>
          <label htmlFor="name" className="sr-only">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      {isSignup ? (
        <div>
          <label htmlFor="confirmPassword" className="sr-only">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className={inputClass}
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl ef-btn-primary text-sm font-medium disabled:opacity-60"
      >
        {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in with email"}
      </button>
    </form>
  );
}
