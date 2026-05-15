"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import { useEffect, useState } from "react";

type TeamRow = {
  id: string;
  name: string;
  description: string | null;
  serviceLine: string | null;
  workspace: { id: string; name: string };
  manager: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  members: Array<{
    id: string;
    user: { id: string; name: string | null; email: string | null };
  }>;
  projects: Array<{
    id: string;
    title: string;
    serviceLine: string | null;
  }>;
  _count: {
    members: number;
    employees: number;
    projects: number;
  };
};

function formatServiceLine(v: string | null) {
  if (!v) return "—";
  return v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get<TeamRow[]>("/api/workflow/getteams");
        setTeams(res.data ?? []);
      } catch {
        customToast.error({ title: "", description: "Failed to load teams." });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Team} windowTitle="Teams">
      <div className="p-4 md:p-6 max-w-6xl">
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-(--foreground) tracking-tight">Teams</h1>
          <p className="text-sm text-(--muted-2) mt-1 max-w-2xl">
            Operational units (practice lines, delivery pods) with a lead, specialization, and
            project assignments. For individual people and roles, use{" "}
            <span className="text-(--muted)">Members</span>.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-(--border) bg-(--surface-2) p-4 animate-pulse h-36"
              />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-(--border) bg-(--surface-2)/50 px-4 py-12 text-center text-sm text-(--muted-2)">
            No teams yet. Create teams in your workspace to group delivery and access.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => {
              const lead =
                team.manager?.name?.trim() || team.manager?.email || "Unassigned lead";
              const preview = team.members
                .slice(0, 3)
                .map((m) => m.user.name?.trim() || m.user.email || "Member")
                .join(", ");

              return (
                <article
                  key={team.id}
                  className="group rounded-lg border border-(--border) bg-(--surface-1) p-4 shadow-sm hover:border-(--border-strong) hover:bg-(--surface-2)/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-(--foreground) leading-snug truncate">
                        {team.name}
                      </p>
                      <p className="text-[11px] text-(--muted-2) mt-0.5 truncate">
                        {team.workspace.name}
                      </p>
                    </div>
                    <span className="shrink-0 rounded border border-(--border) bg-(--surface-2) px-2 py-0.5 text-[11px] font-medium text-(--muted) tabular-nums">
                      {team._count.members} members
                    </span>
                  </div>

                  {team.description ? (
                    <p className="text-xs text-(--muted-2) mt-2 line-clamp-2">{team.description}</p>
                  ) : null}

                  <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 text-[12px]">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-(--muted-2)">
                        Lead
                      </dt>
                      <dd className="text-(--foreground) truncate mt-0.5" title={lead}>
                        {lead}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-(--muted-2)">
                        Focus
                      </dt>
                      <dd className="text-(--muted) truncate mt-0.5">{formatServiceLine(team.serviceLine)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-(--muted-2)">
                        Projects
                      </dt>
                      <dd className="text-(--muted) mt-0.5 flex flex-wrap gap-1">
                        {team.projects.length === 0 ? (
                          <span>—</span>
                        ) : (
                          team.projects.slice(0, 4).map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex max-w-full truncate rounded border border-(--border) bg-(--surface-2) px-1.5 py-0.5 text-[11px]"
                              title={p.title}
                            >
                              {p.title}
                            </span>
                          ))
                        )}
                        {team._count.projects > 4 ? (
                          <span className="text-[11px] text-(--muted-2)">
                            +{team._count.projects - 4} more
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  </dl>

                  {preview ? (
                    <p className="mt-3 pt-3 border-t border-(--border)/80 text-[11px] text-(--muted-2)">
                      <span className="text-(--muted)">Includes:</span> {preview}
                      {team._count.members > 3 ? "…" : ""}
                    </p>
                  ) : null}

                  {team._count.employees > 0 ? (
                    <p className="mt-2 text-[11px] text-(--muted-2)">
                      +{team._count.employees} rostered in directory
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </WorkflowLayout>
  );
}
