"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";
import { customToast } from "@/lib/custom-toast";
import axios from "axios";
import { useEffect, useState } from "react";

type Member = {
  id: string;
  role: string;
  user: { id: string; name?: string; email?: string; image?: string };
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/api/workflow/getmembers");
        setMembers(res.data ?? []);
      } catch {
        customToast.error({ title: "", description: "Failed to load members." });
      }
    };
    load();
  }, []);

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Members} windowTitle="Members">
      <div className="p-4">
        <p className="text-lg font-medium mb-3">Workspace members</p>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="rounded-lg border border-(--border) bg-(--surface-1) px-3 py-2">
              <p className="text-sm">{m.user.name || m.user.email || "Unnamed user"}</p>
              <p className="text-xs text-(--muted-2) mt-1">
                {m.user.email || "No email"} · {m.role}
              </p>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-(--muted-2)">No members found.</p>
          )}
        </div>
      </div>
    </WorkflowLayout>
  );
}

