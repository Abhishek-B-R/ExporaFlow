"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const params = useSearchParams();
  const hasCallbackError = params.get("error") === "Callback";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 gap-y-3">
      <h1 className="text-4xl font-bold mb-2">Sign In</h1>
      {hasCallbackError && (
        <p className="text-sm text-red-300 mb-2">
          Sign-in callback failed. Please verify DB connection and try again.
        </p>
      )}
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="bg-[#111827] text-white px-4 py-2 rounded w-56"
      >
        <span>Sign in with Google</span>
      </button>
      <button
        onClick={() => signIn("github", { callbackUrl: "/" })}
        className="bg-black text-white px-4 py-2 rounded w-56"
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
