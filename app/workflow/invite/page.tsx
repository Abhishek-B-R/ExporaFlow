"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { customToast } from "@/lib/custom-toast";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

type InvitationRecord = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: { name?: string | null; email?: string | null; image?: string | null };
};

const ROLES = ["ADMIN", "MANAGER", "ENGINEER", "QA", "VIEWER"] as const;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-[#e05f5f]",
  MANAGER: "text-[#e5a63b]",
  ENGINEER: "text-[#6f86ff]",
  QA: "text-[#7c5cff]",
  VIEWER: "text-[#a4a6aa]",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "border-[#e5a63b]/30 bg-[#e5a63b]/10 text-[#e5a63b]",
  accepted: "border-[#30b27a]/30 bg-[#30b27a]/10 text-[#30b27a]",
  expired: "border-[#a4a6aa]/30 bg-[#a4a6aa]/10 text-[#a4a6aa]",
};

export default function InvitePage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("ENGINEER");
  const [isSending, setIsSending] = useState(false);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/invite");
      setInvitations(res.data ?? []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const sendInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      customToast.error({ title: "", description: "Enter an email address." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      customToast.error({ title: "", description: "Enter a valid email address." });
      return;
    }

    try {
      setIsSending(true);
      setFallbackLink(null);
      const res = await axios.post("/api/invite", { email: trimmed, role });
      const data = res.data;

      if (data.emailSent) {
        customToast.success({
          title: "Invitation sent",
          description: data.message,
        });
      } else {
        // Email failed to send — show the manual link
        setFallbackLink(data.inviteLink ?? null);
        const reason = data.emailError ? ` Reason: ${data.emailError}` : "";
        customToast.warning({
          title: "Invitation created",
          description: `Email could not be sent.${reason} Copy the invite link below.`,
        });
      }
      setEmail("");
      await fetchInvitations();
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Failed to send invitation."
        : "Failed to send invitation.";
      customToast.error({ title: "Invite failed", description: msg });
    } finally {
      setIsSending(false);
    }
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      customToast.success({ title: "", description: "Invite link copied to clipboard." });
    } catch {
      customToast.error({ title: "", description: "Failed to copy link." });
    }
  };

  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const acceptedCount = invitations.filter((i) => i.status === "accepted").length;

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Members} windowTitle="Invite People">
      <div className="grow overflow-y-auto px-4 md:px-6 py-5 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-medium">Invite People</h1>
          <p className="text-sm text-(--muted-2) mt-1">
            Add collaborators to your workspace. They&apos;ll receive an email with a link to join.
          </p>
        </div>

        {/* Invite form */}
        <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-3">
          <p className="text-sm font-medium">Send an invitation</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendInvite()}
              placeholder="name@company.com"
              className="flex-1 h-10 rounded-lg border border-(--border) bg-(--surface-2) px-3 text-sm outline-none focus:border-[#6f86ff]/50 transition-colors"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
              className="h-10 rounded-lg border border-(--border) bg-(--surface-2) px-3 text-sm outline-none w-full sm:w-36"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <button
              onClick={sendInvite}
              disabled={isSending || !email.trim()}
              className="h-10 px-5 rounded-lg bg-gradient-to-b from-[#6f86ff] to-[#5a6ee0] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
            >
              {isSending ? "Sending…" : "Send Invite"}
            </button>
          </div>

          {/* Fallback link */}
          {fallbackLink && (
            <div className="rounded-lg border border-[#e5a63b]/30 bg-[#e5a63b]/5 p-3">
              <p className="text-xs text-[#e5a63b] font-medium mb-1">
                Email could not be sent. Share this link manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[#caccd4] bg-(--surface-2) rounded px-2 py-1 flex-1 overflow-x-auto break-all">
                  {fallbackLink}
                </code>
                <button
                  onClick={() => copyLink(fallbackLink)}
                  className="shrink-0 text-xs h-7 px-2 rounded border border-(--border) hover:bg-(--surface-3) transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="rounded-lg border border-(--border) bg-(--surface-1) px-4 py-2.5">
            <span className="text-(--muted-2)">Total invites:</span>{" "}
            <span className="font-medium">{invitations.length}</span>
          </div>
          <div className="rounded-lg border border-(--border) bg-(--surface-1) px-4 py-2.5">
            <span className="text-(--muted-2)">Pending:</span>{" "}
            <span className="font-medium text-[#e5a63b]">{pendingCount}</span>
          </div>
          <div className="rounded-lg border border-(--border) bg-(--surface-1) px-4 py-2.5">
            <span className="text-(--muted-2)">Accepted:</span>{" "}
            <span className="font-medium text-[#30b27a]">{acceptedCount}</span>
          </div>
        </div>

        {/* Invitations list */}
        <div className="rounded-xl border border-(--border) bg-(--surface-1) overflow-hidden">
          <div className="px-4 py-3 border-b border-(--border) flex items-center justify-between">
            <p className="text-sm font-medium">Invitation History</p>
            <button
              onClick={fetchInvitations}
              className="text-xs text-(--muted-2) hover:text-white px-2 py-1 rounded border border-(--border) hover:bg-(--surface-3) transition-colors"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="px-4 py-6 text-center">
              <SVGIcon className="inline-flex w-5 animate-spin" svgString={RAW_ICONS.Loader} />
            </div>
          ) : invitations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-(--muted-2)">
                No invitations sent yet. Invite your teammates above!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-(--border)">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-(--surface-2) transition-colors"
                >
                  {/* Avatar placeholder */}
                  <div className="w-8 h-8 rounded-full bg-(--surface-3) flex items-center justify-center text-xs font-medium shrink-0">
                    {inv.email.charAt(0).toUpperCase()}
                  </div>

                  {/* Email & info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{inv.email}</p>
                    <p className="text-xs text-(--muted-2)">
                      Invited by {inv.invitedBy?.name ?? inv.invitedBy?.email ?? "—"} ·{" "}
                      {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>

                  {/* Role */}
                  <span className={`text-xs font-medium shrink-0 ${ROLE_COLORS[inv.role] ?? "text-(--muted-2)"}`}>
                    {inv.role}
                  </span>

                  {/* Status badge */}
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[inv.status] ?? STATUS_COLORS.pending}`}
                  >
                    {inv.status}
                  </span>

                  {/* Expiry */}
                  {inv.status === "pending" && (
                    <span className="text-[11px] text-(--muted-2) shrink-0 hidden md:inline">
                      Expires {new Date(inv.expiresAt).toLocaleDateString("en-GB")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkflowLayout>
  );
}
