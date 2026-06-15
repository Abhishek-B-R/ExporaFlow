"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { StoreStatusBadge } from "@/components/workflow/store-status-badge";
import {
  StoreDirectoryFilterBar,
  type StoreDirectoryFilter,
} from "@/components/workflow/store-directory-filter";
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

type PersonRow = {
  id: string;
  fullName: string;
  email: string;
  designation?: string | null;
  role: string;
  isActive?: boolean;
};

const ROLES = ["MANAGER", "ENGINEER", "QA", "VIEWER"] as const;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-[#e05f5f]",
  MANAGER: "text-[#e5a63b]",
  ENGINEER: "text-sky-600",
  QA: "text-sky-600",
  VIEWER: "text-(--muted-2)",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "border-[#e5a63b]/30 bg-[#e5a63b]/10 text-[#e5a63b]",
  accepted: "border-[#30b27a]/30 bg-[#30b27a]/10 text-[#30b27a]",
  expired: "border-[#a4a6aa]/30 bg-[#a4a6aa]/10 text-(--muted-2)",
};

export default function InvitePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("ENGINEER");
  const [startsActive, setStartsActive] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StoreDirectoryFilter>("active");
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setIsLoadingInvites(true);
      const res = await axios.get("/api/invite");
      setInvitations(res.data ?? []);
    } catch {
      // silent
    } finally {
      setIsLoadingInvites(false);
    }
  }, []);

  const fetchPeople = useCallback(async () => {
    try {
      setIsLoadingPeople(true);
      const res = await axios.get<PersonRow[]>(`/api/employees?status=${statusFilter}`);
      setPeople(res.data ?? []);
    } catch {
      customToast.error({ title: "", description: "Failed to load people." });
      setPeople([]);
    } finally {
      setIsLoadingPeople(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchInvitations();
  }, [fetchInvitations]);

  useEffect(() => {
    void fetchPeople();
  }, [fetchPeople]);

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
      const res = await axios.post("/api/invite", {
        email: trimmed,
        role,
        isActive: startsActive,
        fullName: fullName.trim() || undefined,
      });
      const data = res.data;

      if (data.emailSent) {
        customToast.success({
          title: "Invitation sent",
          description: data.message,
        });
      } else {
        setFallbackLink(data.inviteLink ?? null);
        const reason = data.emailError ? ` Reason: ${data.emailError}` : "";
        customToast.warning({
          title: "Invitation created",
          description: `Email could not be sent.${reason} Copy the invite link below.`,
        });
      }
      setEmail("");
      setFullName("");
      await Promise.all([fetchInvitations(), fetchPeople()]);
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message ?? "Failed to send invitation."
        : "Failed to send invitation.";
      customToast.error({ title: "Invite failed", description: msg });
    } finally {
      setIsSending(false);
    }
  };

  const updatePersonRole = async (id: string, nextRole: string) => {
    try {
      await axios.patch(`/api/employees/${id}`, { role: nextRole });
      await fetchPeople();
      customToast.success({ title: "", description: "Role updated." });
    } catch {
      customToast.error({ title: "", description: "Could not update role." });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.patch(`/api/employees/${id}`, { isActive });
      await fetchPeople();
      customToast.success({
        title: "",
        description: isActive ? "Person marked active." : "Person marked inactive.",
      });
    } catch {
      customToast.error({ title: "", description: "Could not update status." });
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

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Members} windowTitle="People">
      <div className="grow overflow-y-auto px-4 md:px-6 py-5 space-y-6 max-w-6xl">
        <div>
          <h1 className="text-xl font-medium">People</h1>
          <p className="text-sm text-(--muted-2) mt-1 max-w-2xl">
            Invite teammates, set their role and active status, and manage who can be assigned to
            projects. Project membership is handled when you create or edit a project.
          </p>
        </div>

        <div className="rounded-xl border border-(--border) bg-(--surface-1) p-4 space-y-3">
          <p className="text-sm font-medium">Add a person</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name (optional)"
              className="h-10 rounded-lg border border-(--border) bg-(--surface-2) px-3 text-sm outline-none focus:border-sky-400/50 transition-colors"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendInvite()}
              placeholder="name@company.com"
              className="h-10 rounded-lg border border-(--border) bg-(--surface-2) px-3 text-sm outline-none focus:border-sky-400/50 transition-colors"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
              className="h-10 rounded-lg border border-(--border) bg-(--surface-2) px-3 text-sm outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-(--border) bg-(--surface-2) text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={startsActive}
                onChange={(e) => setStartsActive(e.target.checked)}
                className="rounded border-(--border)"
              />
              Active
            </label>
          </div>
          <div className="flex justify-end">
            <button
              onClick={sendInvite}
              disabled={isSending || !email.trim()}
              className="h-10 px-5 rounded-lg ef-btn-primary text-sm disabled:opacity-50 shrink-0"
            >
              {isSending ? "Sending…" : "Send invite"}
            </button>
          </div>

          {fallbackLink ? (
            <div className="rounded-lg border border-[#e5a63b]/30 bg-[#e5a63b]/5 p-3">
              <p className="text-xs text-[#e5a63b] font-medium mb-1">
                Email could not be sent. Share this link manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-(--foreground) bg-(--surface-2) rounded px-2 py-1 flex-1 overflow-x-auto break-all">
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
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-sm font-medium">Directory</h2>
            <StoreDirectoryFilterBar value={statusFilter} onChange={setStatusFilter} />
          </div>

          <div className="rounded-xl border border-(--border) bg-(--surface-1) overflow-hidden">
            {isLoadingPeople ? (
              <div className="px-4 py-8 text-center">
                <SVGIcon className="inline-flex w-5 animate-spin" svgString={RAW_ICONS.Loader} />
              </div>
            ) : people.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-(--muted-2)">
                No people yet. Invite someone above to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--surface-2) text-left text-[11px] uppercase tracking-wider text-(--muted-2)">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((person) => (
                      <tr
                        key={person.id}
                        className={`border-b border-(--border) last:border-0 hover:bg-(--surface-2)/50 ${
                          person.isActive === false ? "opacity-70" : ""
                        }`}
                      >
                        <td className="px-4 py-3">{person.fullName}</td>
                        <td className="px-4 py-3 text-(--muted)">{person.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={person.role}
                            onChange={(e) => void updatePersonRole(person.id, e.target.value)}
                            className="h-8 rounded-md border border-(--border) bg-(--surface-2) px-2 text-xs outline-none"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r.charAt(0) + r.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <StoreStatusBadge isActive={person.isActive !== false} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="text-xs text-sky-700 hover:underline"
                            onClick={() => void toggleActive(person.id, person.isActive === false)}
                          >
                            {person.isActive === false ? "Mark active" : "Mark inactive"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-(--border) bg-(--surface-1) overflow-hidden">
          <div className="px-4 py-3 border-b border-(--border) flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Pending invitations</p>
              {pendingCount > 0 ? (
                <p className="text-xs text-(--muted-2) mt-0.5">{pendingCount} awaiting response</p>
              ) : null}
            </div>
            <button
              onClick={fetchInvitations}
              className="text-xs text-(--muted-2) hover:text-(--foreground) px-2 py-1 rounded border border-(--border) hover:bg-(--surface-3) transition-colors"
            >
              Refresh
            </button>
          </div>

          {isLoadingInvites ? (
            <div className="px-4 py-6 text-center">
              <SVGIcon className="inline-flex w-5 animate-spin" svgString={RAW_ICONS.Loader} />
            </div>
          ) : invitations.filter((i) => i.status === "pending").length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-(--muted-2)">
              No pending invitations.
            </div>
          ) : (
            <div className="divide-y divide-(--border)">
              {invitations
                .filter((inv) => inv.status === "pending")
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-(--surface-2) transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-(--surface-3) flex items-center justify-center text-xs font-medium shrink-0">
                      {inv.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{inv.email}</p>
                      <p className="text-xs text-(--muted-2)">
                        Invited by {inv.invitedBy?.name ?? inv.invitedBy?.email ?? "—"} ·{" "}
                        Expires {new Date(inv.expiresAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium shrink-0 ${ROLE_COLORS[inv.role] ?? "text-(--muted-2)"}`}
                    >
                      {inv.role}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS.pending}`}
                    >
                      pending
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </WorkflowLayout>
  );
}
