"use client";

import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { customToast } from "@/lib/custom-toast";
import { RAW_ICONS } from "@/lib/icons";
import { useState } from "react";

export default function InvitePage() {
  const [email, setEmail] = useState("");

  const sendInvite = () => {
    if (!email.trim()) return;
    customToast.success({
      title: "Invite prepared",
      description: `Invite queued for ${email}.`,
    });
    setEmail("");
  };

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Members} windowTitle="Invite People">
      <div className="p-4">
        <p className="text-lg font-medium mb-2">Invite teammates</p>
        <p className="text-sm text-(--muted-2)">
          Add collaborators to your workspace.
        </p>
        <div className="mt-4 rounded-lg border border-(--border) bg-(--surface-1) p-3 flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="flex-1 h-9 rounded border border-(--border) bg-(--surface-2) px-2"
          />
          <button
            onClick={sendInvite}
            className="h-9 px-3 rounded border border-(--border-strong) bg-(--surface-3)"
          >
            Invite
          </button>
        </div>
      </div>
    </WorkflowLayout>
  );
}

