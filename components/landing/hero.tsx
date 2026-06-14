"use client";

import axios from "axios";
import { useState } from "react";
import Link from "next/link";
import { customToast } from "@/lib/custom-toast";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative">
      <div className="ef-page-gutter flex justify-center items-center min-h-[340px] sm:min-h-[400px] py-16 sm:py-20">
        <div className="flex flex-col items-center text-center max-w-3xl">
          <p className="ef-kicker mb-3">Operations for consulting teams</p>
          <h1 className="text-[1.75rem] sm:text-4xl lg:text-[2.75rem] font-semibold tracking-[-0.03em] text-(--foreground) leading-[1.15]">
            Projects, incidents, and change —{" "}
            <span className="text-(--accent)">one workspace</span>
          </h1>
          <p className="mt-4 text-[0.9375rem] sm:text-base text-(--muted-2) max-w-xl leading-relaxed">
            Built for SAP, Oracle, managed services, and software delivery — with SLA-aware
            change management, customer directory, and the same dashboard your leads use daily.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/workflow/dashboard"
              className="ef-btn-outline h-10 gap-2 rounded-lg px-4 text-sm"
            >
              <LayoutDashboard className="size-4 text-(--accent)" strokeWidth={2} />
              Open dashboard
              <ArrowRight className="size-3.5 opacity-60" strokeWidth={2} />
            </Link>
            <Link
              href="/signup"
              className="ef-btn-primary h-10 rounded-lg px-4 text-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
      <DashboardPreview />
      <WaitlistStrip />
    </div>
  );
}

function DashboardPreview() {
  const metrics = [
    { label: "Open incidents", value: "24" },
    { label: "Open changes", value: "11" },
    { label: "On hold", value: "3" },
    { label: "SLA breaches", value: "2" },
    { label: "Customers", value: "18" },
    { label: "Projects", value: "9" },
  ];

  return (
      <div className="ef-page-gutter pb-10">
      <div className="ef-card overflow-hidden max-w-4xl mx-auto">
        <div className="h-11 border-b border-(--border) bg-(--surface-2) px-4 flex items-center justify-between">
          <span className="text-sm font-medium text-(--foreground)">Operations overview</span>
          <span className="text-xs text-(--muted-2)">Live preview</span>
        </div>
        <div className="p-4 md:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {metrics.map((m) => (
              <div key={m.label} className="ef-metric">
                <p className="ef-metric-label">{m.label}</p>
                <p className="ef-metric-value">{m.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-12 gap-3 rounded-lg border border-(--border) bg-(--surface-2)/50 p-3">
            <div className="col-span-3 hidden sm:block space-y-0.5">
              <p className="text-xs font-medium text-(--muted-2) px-2 py-1.5">Workspace</p>
              {["Dashboard", "Projects", "Store", "People"].map((item, i) => (
                <div
                  key={item}
                  className={`rounded-md px-2 py-1.5 text-xs ${
                    i === 0
                      ? "bg-(--sidebar-active-bg) font-medium text-(--foreground)"
                      : "text-(--muted) hover:bg-(--surface-3)/60"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="col-span-12 sm:col-span-9 rounded-lg border border-(--border) bg-(--surface-1) p-3 min-h-[132px]">
              <p className="text-xs text-(--muted-2) mb-2.5">Portfolio</p>
              <div className="space-y-1.5">
                {[
                  { name: "SAP S/4 rollout", status: "Working", sla: "Clear" },
                  { name: "Oracle AMS", status: "Planned", sla: "2 at risk" },
                  { name: "Managed NOC", status: "Backlog", sla: "Clear" },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-2 rounded-md border border-(--border) bg-(--surface-2) px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-(--foreground) truncate">{row.name}</span>
                    <span className="shrink-0 rounded-md border border-(--border) px-1.5 py-0.5 text-[11px] text-(--muted)">
                      {row.status}
                    </span>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                        row.sla.includes("risk")
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}
                    >
                      {row.sla}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitlistStrip() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const waitListCall = async () => {
    try {
      setIsLoading(true);
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        customToast.warning({ title: "", description: "Enter a valid email address." });
        return;
      }
      const response = await axios.post<{ message: string }>("/api/waitlist", {
        userEmail: email.trim(),
      });
      if (response.data) {
        customToast.info({ title: "", description: response.data.message });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        customToast.error({
          title: "",
          description: error.response?.data?.message || "Something went wrong.",
        });
      }
    } finally {
      setEmail("");
      setIsLoading(false);
    }
  };

  return (
    <div className="ef-page-gutter pb-16">
      <div className="ef-card max-w-3xl mx-auto px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-(--foreground)">Join the waitlist</p>
          <p className="text-xs text-(--muted-2) mt-0.5">
            Early access for consulting and MSP operations teams.
          </p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && void waitListCall()}
            placeholder="you@company.com"
            className="ef-field flex-1 sm:w-52 h-10 px-3 text-sm"
          />
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void waitListCall()}
            className="ef-btn-outline h-10 shrink-0 rounded-lg px-4 text-sm disabled:opacity-50"
          >
            {isLoading ? "…" : "Notify me"}
          </button>
        </div>
      </div>
    </div>
  );
}
