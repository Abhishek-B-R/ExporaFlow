"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const hasCallbackError = error === "Callback";
  const accessDenied = error === "AccessDenied" || params.get("access") === "denied";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 gap-y-3 bg-(--background) text-(--foreground)">
      <h1 className="text-4xl font-semibold mb-2">Sign In</h1>
      {accessDenied && (
        <p className="text-sm text-red-600 mb-2 max-w-md text-center px-4">
          This account is not invited to this workspace. Ask the owner for an invite,
          then sign in with the invited email.
        </p>
      )}
      {hasCallbackError && (
        <p className="text-sm text-red-600 mb-2">
          Sign-in callback failed. Please verify DB connection and try again.
        </p>
      )}
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md w-56 shadow-sm transition-colors"
      >
        <span>Sign in with Google</span>
      </button>
      <button
        onClick={() => signIn("github", { callbackUrl: "/" })}
        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md w-56 shadow-sm transition-colors"
      >
        <span>Sign in with GitHub</span>
      </button>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignInContent />
    </Suspense>
  );
}
