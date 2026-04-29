"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import { useEffect, useState } from "react";

type Team = {
  id: string;
  name: string;
  members: Array<{ id: string }>;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/workflow/getteams");
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
      <div className="p-4">
        <p className="text-lg font-medium mb-3">Teams</p>
        <div className="space-y-2">
          {teams.map((team) => (
            <div key={team.id} className="rounded-lg border border-(--border) bg-(--surface-1) px-3 py-2">
              <p className="text-sm">{team.name}</p>
              <p className="text-xs text-(--muted-2) mt-1">
                {team.members.length} member{team.members.length === 1 ? "" : "s"}
              </p>
            </div>
          ))}
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg border border-(--border) bg-(--surface-1) px-3 py-3 animate-pulse">
                  <div className="h-3.5 bg-(--surface-3) rounded w-1/4 mb-2" />
                  <div className="h-2.5 bg-(--surface-3) rounded w-1/3" />
                </div>
              ))}
            </>
          ) : teams.length === 0 ? (
            <p className="text-sm text-(--muted-2)">No teams available yet.</p>
          ) : null}
        </div>
      </div>
    </WorkflowLayout>
  );
}

