"use client";

import axios from "axios";
import { useEffect, useState, type ReactNode } from "react";
import ProfilePulseLoader from "./profile-loader";
import { customToast } from "@/lib/custom-toast";
import { resolveUsername } from "@/lib/default-username";

type UserInfo = {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
};

function getInitials(name: string | null | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const word = parts[0];
    return ((word[0] ?? "") + (word.slice(-1) ?? "")).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-5 py-4 border-b border-(--border) last:border-b-0">
      <label className="block text-sm font-medium text-(--foreground)">
        {label}
      </label>
      {hint ? (
        <p className="text-xs text-(--muted-2) mt-0.5 mb-2">{hint}</p>
      ) : null}
      <div className={hint ? "" : "mt-2"}>{children}</div>
    </div>
  );
}

export default function ProfileSection() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedUsername, setUpdatedUsername] = useState("");
  const [updatedFullname, setUpdatedFullname] = useState("");
  const [inEditMode, setInEditMode] = useState(false);
  const [updatingUserInfo, setUpdatingUserinfo] = useState(false);

  const fetchUserInfo = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/user/getprofile");
      setUserInfo(response.data);
    } catch {
      customToast.error({ title: "", description: "Could not load profile." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!userInfo) return;
    setUpdatedUsername(userInfo.username?.trim() || resolveUsername(userInfo));
    setUpdatedFullname(userInfo.name ?? "");
  }, [userInfo]);

  const updateUserInfo = async () => {
    setUpdatingUserinfo(true);
    try {
      const response = await axios.patch("/api/user/updateprofile", {
        username: updatedUsername,
        fullname: updatedFullname,
      });
      if (response.data) {
        customToast.info({ description: "Profile updated." });
        setInEditMode(false);
        void fetchUserInfo();
      }
    } catch {
      customToast.error({
        title: "",
        description: "Could not update profile.",
      });
    } finally {
      setUpdatingUserinfo(false);
    }
  };

  const hasChanges =
    updatedUsername !== (userInfo?.username ?? "") ||
    updatedFullname !== (userInfo?.name ?? "");

  return (
    <div className="min-h-screen bg-(--background) pt-14 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
        <header className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-(--foreground)">
            Profile
          </h1>
          <p className="text-sm text-(--muted-2) mt-1">
            Your account details for ExporaFlow.
          </p>
        </header>

        {isLoading ? (
          <ProfilePulseLoader />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inEditMode && hasChanges) void updateUserInfo();
            }}
            className="ef-card overflow-hidden"
          >
            <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-(--border) bg-(--surface-2)/40">
              <div>
                <p className="text-sm font-medium text-(--foreground)">
                  Profile picture
                </p>
                <p className="text-xs text-(--muted-2) mt-0.5">
                  Generated from your display name
                </p>
              </div>
              <div
                className="size-12 shrink-0 rounded-full bg-(--accent-muted) border border-(--sidebar-active-border) flex items-center justify-center text-sm font-semibold text-(--accent-hover)"
                aria-label="Profile initials"
              >
                {getInitials(userInfo?.name)}
              </div>
            </div>

            <FieldBlock
              label="Email"
              hint="Managed by your sign-in provider — cannot be changed here."
            >
              <div className="ef-field h-10 px-3 flex items-center text-sm text-(--muted) bg-(--surface-2)">
                {userInfo?.email || "—"}
              </div>
            </FieldBlock>

            <FieldBlock label="Full name">
              {inEditMode ? (
                <input
                  className="ef-field h-10 px-3 text-sm"
                  value={updatedFullname}
                  onChange={(e) => setUpdatedFullname(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              ) : (
                <div className="ef-field h-10 px-3 flex items-center text-sm bg-(--surface-2)">
                  {userInfo?.name || "Not set"}
                </div>
              )}
            </FieldBlock>

            <FieldBlock label="Username">
              {inEditMode ? (
                <input
                  className="ef-field h-10 px-3 text-sm"
                  value={updatedUsername}
                  onChange={(e) => setUpdatedUsername(e.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                />
              ) : userInfo ? (
                <div className="ef-field h-10 px-3 flex items-center text-sm bg-(--surface-2)">
                  {resolveUsername(userInfo)}
                </div>
              ) : null}
            </FieldBlock>

            <div className="px-5 py-4 flex justify-end gap-2 bg-(--surface-2)/30">
              <button
                type="button"
                onClick={() => {
                  if (inEditMode && userInfo) {
                    setUpdatedUsername(
                      userInfo.username?.trim() || resolveUsername(userInfo),
                    );
                    setUpdatedFullname(userInfo.name ?? "");
                  }
                  setInEditMode((v) => !v);
                }}
                className={
                  inEditMode
                    ? "ef-btn-outline h-9 px-4 rounded-lg text-sm"
                    : "ef-btn-outline h-9 px-4 rounded-lg text-sm"
                }
              >
                {inEditMode ? "Cancel" : "Edit"}
              </button>
              {inEditMode ? (
                <button
                  type="submit"
                  disabled={!hasChanges || updatingUserInfo}
                  className="ef-btn-primary h-9 px-4 rounded-lg text-sm disabled:opacity-50"
                >
                  {updatingUserInfo ? "Saving…" : "Save"}
                </button>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
