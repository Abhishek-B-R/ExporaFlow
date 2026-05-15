"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { WorkflowLayout } from "@/components/workflow/workflow-layout";
import { RAW_ICONS } from "@/lib/icons";

type Metrics = {
  incidentOpen: number;
  changeOpen: number;
  onHoldChange: number;
  slaBreaches: number;
  activeCustomers: number;
  employees: number;
  projects: number;
};

export default function WorkflowDashboardPage() {
  const { status } = useSession({ required: true });
  const router = useRouter();
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get("/api/workflow/dashboard");
        setM(res.data);
      } catch {
        setM(null);
      }
    };
    void run();
  }, []);

  const cards: { label: string; value: number; hint?: string }[] = m
    ? [
        { label: "Open incident tickets", value: m.incidentOpen },
        { label: "Open change tickets", value: m.changeOpen },
        { label: "Change tickets on hold", value: m.onHoldChange },
        { label: "SLA breaches (change)", value: m.slaBreaches },
        { label: "Active customers", value: m.activeCustomers },
        { label: "Employees", value: m.employees },
        { label: "Your projects", value: m.projects },
      ]
    : [];

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Docs} windowTitle="Dashboard">
      <div className="p-4 md:p-6 lg:p-8 overflow-y-auto h-full">
        <h1 className="text-lg md:text-xl font-medium text-(--foreground)">
          Operations overview
        </h1>
        <p className="text-sm text-(--muted-2) mt-1 mb-6">
          Incident management tickets, change management, SLA signals, and directory counts.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-lg border border-(--border) bg-(--surface-2) px-4 py-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-(--muted-2)">{c.label}</p>
              <p className="text-2xl font-semibold text-(--foreground) mt-2 tabular-nums">
                {c.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </WorkflowLayout>
  );
}
