"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No invitation token found. Please check your invite link.");
      return;
    }

    const acceptInvite = async () => {
      try {
        const res = await axios.post("/api/invite/accept", { token });
        setStatus("success");
        setMessage(res.data.message);
        setWorkspaceName(res.data.workspaceName ?? "");
        setRole(res.data.role ?? "");
      } catch (error) {
        setStatus("error");
        if (axios.isAxiosError(error)) {
          const data = error.response?.data;
          setMessage(data?.message ?? "Failed to accept invitation.");

          // If not logged in, redirect to sign in
          if (error.response?.status === 401) {
            setTimeout(() => {
              router.push(`/auth/signin?callbackUrl=/invite/accept?token=${token}`);
            }, 2000);
          }
        } else {
          setMessage("An unexpected error occurred.");
        }
      }
    };

    acceptInvite();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-(--background) flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-(--border) bg-(--surface-1) p-8 text-center">
          {/* Loading state */}
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
              <h1 className="text-xl font-semibold text-(--foreground) mb-2">
                Accepting invitation…
              </h1>
              <p className="text-sm text-(--muted-2)">
                Please wait while we process your invitation.
              </p>
            </>
          )}

          {/* Success state */}
          {status === "success" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#30b27a]/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 12.5L10.5 15L16 9"
                    stroke="#30b27a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-(--foreground) mb-2">
                Welcome to {workspaceName}!
              </h1>
              <p className="text-sm text-(--muted-2) mb-1">{message}</p>
              {role && (
                <p className="text-xs text-sky-600 mb-6">
                  Role: <span className="font-medium">{role}</span>
                </p>
              )}
              <button
                onClick={() => router.push("/workflow/inbox")}
                className="h-10 px-6 rounded-lg ef-btn-primary text-sm disabled:opacity-50 shrink-0"
              >
                Go to Workspace
              </button>
            </>
          )}

          {/* Error state */}
          {status === "error" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#e05f5f]/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 9L9 15M9 9L15 15"
                    stroke="#e05f5f"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-(--foreground) mb-2">
                Invitation Error
              </h1>
              <p className="text-sm text-(--muted-2) mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push("/auth/signin")}
                  className="h-10 px-5 rounded-lg border border-sky-200 bg-sky-50 text-sky-600 text-sm hover:bg-sky-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="h-10 px-5 rounded-lg border border-(--border) text-(--muted-2) text-sm hover:bg-(--surface-3) transition-colors"
                >
                  Go Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-(--background) flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
