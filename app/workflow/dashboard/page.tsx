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

  const cards: { label: string; value: number }[] = m
    ? [
        { label: "Open incidents", value: m.incidentOpen },
        { label: "Open changes", value: m.changeOpen },
        { label: "Changes on hold", value: m.onHoldChange },
        { label: "SLA breaches", value: m.slaBreaches },
        { label: "Active customers", value: m.activeCustomers },
        { label: "Employees", value: m.employees },
        { label: "Your projects", value: m.projects },
      ]
    : [];

  return (
    <WorkflowLayout windowSvg={RAW_ICONS.Docs} windowTitle="Dashboard">
      <div className="p-5 md:p-6 lg:p-8 overflow-y-auto h-full">
        <h1 className="text-lg font-semibold tracking-tight text-(--foreground)">
          Operations overview
        </h1>
        <p className="text-sm text-(--muted-2) mt-1 mb-6 max-w-lg">
          Incident and change tickets, SLA signals, and directory counts for your workspace.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="ef-metric">
              <p className="ef-metric-label">{c.label}</p>
              <p className="ef-metric-value">{c.value}</p>
            </div>
          ))}
        </div>
      </div>
    </WorkflowLayout>
  );
}
