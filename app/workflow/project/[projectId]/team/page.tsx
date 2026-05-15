"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { customToast } from "@/lib/custom-toast";
import { ProjectSubpageFrame } from "@/components/workflow/project-subpage-frame";

type Row = {
  id: string;
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
};

export default function ProjectTeamPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const run = async () => {
      try {
        const res = await axios.get<Row[]>("/api/workflow/getmembers", {
          params: { projectId },
        });
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch {
        customToast.error({ title: "", description: "Could not load project team." });
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [projectId]);

  return (
    <ProjectSubpageFrame
      projectId={projectId}
      pageHeading="Team"
      pageSubheading="People with access to this project (creator and project members)."
    >
      <div className="rounded-md border border-(--border) bg-(--surface-1) overflow-hidden shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-(--border) bg-(--surface-2) text-left text-[11px] uppercase tracking-wide text-(--muted-2)">
              <th className="px-3 py-2 font-medium">Member</th>
              <th className="px-3 py-2 font-medium hidden sm:table-cell">Email</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-(--muted-2) text-center">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-(--muted-2) text-center">
                  No members loaded.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-(--border)/70 last:border-0 hover:bg-(--surface-2)/50 transition-colors"
                >
                  <td className="px-3 py-2 font-medium text-(--foreground)">
                    {r.user.name?.trim() || r.user.email || "User"}
                  </td>
                  <td className="px-3 py-2 text-(--muted) hidden sm:table-cell">
                    {r.user.email ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ProjectSubpageFrame>
  );
}
