"use client";

import axios from "axios";
import { useState } from "react";
import { BlurFade } from "../magicui/blur-fade";
import Link from "next/link";
import { customToast } from "@/lib/custom-toast";
import { motion } from "framer-motion";
import { LayoutDashboard, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative">
      <div className="relative flex px-4 sm:px-6 md:px-10 lg:px-14 xl:px-28 2xl:px-40 justify-center items-center min-h-[320px] sm:min-h-[380px]">
        <div className="flex flex-col items-center text-center max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--accent) mb-4"
          >
            Enterprise consulting operations
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-(--foreground)"
          >
            Run projects, incidents, and change{" "}
            <span className="text-(--accent)">in one workspace</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="mt-4 text-sm sm:text-base text-(--muted-2) max-w-2xl leading-relaxed"
          >
            ExporaFlow is built for SAP, Oracle, managed services, and software delivery teams —
            with SLA-aware change management, store directory, and the same operational dashboard
            your delivery leads use every day.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/workflow/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--sidebar-active-border)] bg-[var(--sidebar-active-bg)] px-4 text-sm font-medium text-(--foreground) shadow-sm hover:bg-(--surface-3) transition-colors"
            >
              <LayoutDashboard className="size-4 text-(--accent)" />
              Open dashboard
              <ArrowRight className="size-4 opacity-70" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-md ef-btn-primary px-4 text-sm font-medium shadow-sm transition-colors"
            >
              Get started
            </Link>
          </motion.div>
        </div>
      </div>
      <DashboardPreview />
      <WaitlistStrip />
    </div>
  );
}

function DashboardPreview() {
  const metrics = [
    { label: "Open incident tickets", value: "24" },
    { label: "Open change tickets", value: "11" },
    { label: "Change on hold", value: "3" },
    { label: "SLA breaches", value: "2" },
    { label: "Active customers", value: "18" },
    { label: "Your projects", value: "9" },
  ];

  return (
    <BlurFade delay={0.35} inView className="px-4 sm:px-6 md:px-10 lg:px-14 xl:px-28 2xl:px-40 pb-8">
      <div className="rounded-lg border border-(--border) bg-(--surface-1) shadow-[var(--shell-shadow)] overflow-hidden">
        <div className="h-10 border-b border-(--border) bg-(--surface-2) px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-(--foreground)">Operations overview</span>
            <span className="hidden sm:inline text-[11px] text-(--muted-2)">
              — same view as your signed-in dashboard
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-(--muted-2)">Preview</span>
        </div>
        <div className="p-4 md:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-(--border) bg-(--surface-2) px-3 py-4 shadow-sm"
              >
                <p className="text-[10px] uppercase tracking-wide text-(--muted-2) leading-snug">
                  {m.label}
                </p>
                <p className="text-xl font-semibold text-(--foreground) mt-2 tabular-nums">
                  {m.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-12 gap-3 rounded-md border border-(--border) bg-(--surface-2)/60 p-3">
            <div className="col-span-3 hidden sm:block space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-(--muted-2) px-2 py-1">
                Workspace
              </p>
              {["Dashboard", "Projects", "Store", "People"].map((item, i) => (
                <div
                  key={item}
                  className={`rounded-md px-2 py-1.5 text-[11px] ${
                    i === 0
                      ? "bg-[var(--sidebar-active-bg)] border border-[var(--sidebar-active-border)] text-(--foreground)"
                      : "text-(--muted) hover:bg-(--surface-3)/50"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="col-span-12 sm:col-span-9 rounded-md border border-(--border) bg-(--surface-1) p-3 min-h-[140px]">
              <p className="text-xs text-(--muted-2) mb-3">Portfolio · operational density</p>
              <div className="space-y-2">
                {[
                  { name: "SAP S/4 rollout", status: "Working", sla: "Clear" },
                  { name: "Oracle AMS", status: "Planned", sla: "2 at risk" },
                  { name: "Managed NOC", status: "Backlog", sla: "Clear" },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-2 rounded-md border border-(--border)/80 bg-(--surface-2) px-3 py-2 text-[12px]"
                  >
                    <span className="font-medium text-(--foreground) truncate">{row.name}</span>
                    <span className="shrink-0 rounded border border-(--border) px-1.5 py-0.5 text-[10px] text-(--muted)">
                      {row.status}
                    </span>
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${
                        row.sla.includes("risk")
                          ? "border-rose-400/40 bg-rose-50 text-rose-700"
                          : "border-emerald-400/40 bg-emerald-50 text-emerald-700"
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
    </BlurFade>
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
    <div className="px-4 sm:px-6 md:px-10 lg:px-14 xl:px-28 2xl:px-40 pb-12">
      <div className="rounded-lg border border-(--border) bg-(--surface-2) px-4 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
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
            className="flex-1 sm:w-56 h-10 rounded-md border border-(--border) bg-(--surface-1) px-3 text-sm text-(--foreground) placeholder:text-(--muted-2) outline-none focus:border-[var(--sidebar-active-border)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void waitListCall()}
            className="h-10 shrink-0 rounded-md border border-[var(--sidebar-active-border)] bg-[var(--sidebar-active-bg)] px-4 text-sm font-medium text-(--foreground) hover:bg-(--surface-3) disabled:opacity-50 transition-colors"
          >
            {isLoading ? "…" : "Notify me"}
          </button>
        </div>
      </div>
    </div>
  );
}
