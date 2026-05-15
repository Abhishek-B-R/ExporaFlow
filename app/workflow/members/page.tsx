"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import { useEffect, useState } from "react";

type WorkspaceRole = {
  workspaceId: string;
  workspaceName: string;
  role: string;
};

type MemberRow = {
  id: string;
  userId: string;
  role: string;
  workspaces: WorkspaceRole[];
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  employee: {
    phoneNumber?: string | null;
    designation?: string | null;
    organizationAccess?: unknown;
    team: { id: string; name: string } | null;
  } | null;
  projects: Array<{ id: string; title: string; role: string }>;
  serviceLines: string[];
};

function formatServiceLine(v: string) {
  return v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatOrgAccessLabel(access: unknown): string {
  if (access == null) return "—";
  if (Array.isArray(access)) {
    const n = access.filter((x) => typeof x === "string").length;
    return n === 0 ? "—" : `${n} workspace${n === 1 ? "" : "s"}`;
  }
  return "—";
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get<MemberRow[]>("/api/workflow/getmembers");
        setMembers(res.data ?? []);
      } catch {
        customToast.error({ title: "", description: "Failed to load members." });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Members} windowTitle="Members">
      <div className="p-4 md:p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-(--foreground) tracking-tight">
            Employee directory
          </h1>
          <p className="text-sm text-(--muted-2) mt-1 max-w-2xl">
            Individuals linked to your workspaces: roles, contact details, directory team
            assignment, and service-line permissions. Operational groupings live under{" "}
            <span className="text-(--muted)">Teams</span>.
          </p>
        </div>

        <div className="rounded-lg border border-(--border) bg-(--surface-2) overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-(--border) bg-(--surface-1) text-left text-[11px] uppercase tracking-wider text-(--muted-2)">
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Phone</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Team</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Org access</th>
                  <th className="px-4 py-3 font-medium hidden xl:table-cell">Projects</th>
                  <th className="px-4 py-3 font-medium hidden xl:table-cell">Service lines</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-(--border)/80">
                        <td className="px-4 py-3" colSpan={8}>
                          <div className="h-4 bg-(--surface-3) rounded animate-pulse w-2/3" />
                        </td>
                      </tr>
                    ))
                  : members.length === 0
                    ? (
                        <tr>
                          <td
                            className="px-4 py-8 text-center text-(--muted-2)"
                            colSpan={8}
                          >
                            No members found.
                          </td>
                        </tr>
                      )
                    : members.map((m) => {
                        const display =
                          m.user.name?.trim() ||
                          m.user.email ||
                          "Unnamed user";
                        const workspaceSummary = m.workspaces
                          .map((w) => `${w.workspaceName} · ${w.role}`)
                          .join(" · ");
                        const projectTitles = m.projects.map((p) => p.title);
                        const projectsPreview =
                          projectTitles.length <= 2
                            ? projectTitles.join(", ")
                            : `${projectTitles.slice(0, 2).join(", ")} +${projectTitles.length - 2}`;

                        return (
                          <tr
                            key={m.userId}
                            className="border-b border-(--border)/60 hover:bg-(--surface-3)/40 transition-colors"
                          >
                            <td className="px-4 py-3 align-top">
                              <div className="flex items-start gap-3">
                                <div className="size-9 rounded-full bg-(--surface-3) border border-(--border) shrink-0 flex items-center justify-center text-[10px] font-semibold text-(--muted)">
                                  {(() => {
                                    const n = (m.user.name ?? "").trim();
                                    if (n) {
                                      const p = n.split(/\s+/).filter(Boolean);
                                      if (p.length >= 2) {
                                        return `${p[0][0] ?? ""}${p[1][0] ?? ""}`.toUpperCase();
                                      }
                                      return n.slice(0, 2).toUpperCase();
                                    }
                                    const e = (m.user.email ?? "").trim();
                                    return e ? e.slice(0, 2).toUpperCase() : "?";
                                  })()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-(--foreground) truncate">
                                    {display}
                                  </p>
                                  {m.employee?.designation ? (
                                    <p className="text-xs text-(--muted-2) truncate">
                                      {m.employee.designation}
                                    </p>
                                  ) : null}
                                  <p className="text-xs text-(--muted-2) sm:hidden truncate mt-0.5">
                                    {m.user.email ?? "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top text-(--muted) hidden sm:table-cell max-w-[200px] truncate">
                              {m.user.email ?? "—"}
                            </td>
                            <td className="px-4 py-3 align-top text-(--muted) hidden lg:table-cell whitespace-nowrap">
                              {m.employee?.phoneNumber ?? "—"}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className="inline-flex items-center rounded-md border border-(--border) bg-(--surface-1) px-2 py-0.5 text-xs font-medium text-(--foreground)">
                                {m.role}
                              </span>
                              <p className="text-xs text-(--muted-2) mt-1 max-w-[220px] leading-snug">
                                {workspaceSummary}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top text-(--muted) hidden md:table-cell">
                              {m.employee?.team?.name ?? "—"}
                            </td>
                            <td className="px-4 py-3 align-top text-(--muted) hidden lg:table-cell text-xs">
                              <span title={JSON.stringify(m.employee?.organizationAccess ?? [])}>
                                {formatOrgAccessLabel(m.employee?.organizationAccess)}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top text-(--muted) hidden xl:table-cell max-w-[240px]">
                              {m.projects.length === 0 ? (
                                "—"
                              ) : (
                                <span title={projectTitles.join("\n")}>
                                  {projectsPreview}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top text-(--muted) hidden xl:table-cell max-w-[200px]">
                              {m.serviceLines.length === 0
                                ? "—"
                                : m.serviceLines.map(formatServiceLine).join(", ")}
                            </td>
                          </tr>
                        );
                      })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WorkflowLayout>
  );
}
