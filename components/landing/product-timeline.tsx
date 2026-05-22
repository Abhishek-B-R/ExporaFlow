export default function ProductTimeline() {
  const roadmapHealth = [
    { label: "Research", progress: 82, marker: 76 },
    { label: "Design", progress: 68, marker: 64 },
    { label: "Development", progress: 54, marker: 58 },
    { label: "QA", progress: 44, marker: 39 },
  ];

  const recentUpdates = [
    { title: "Sprint 4 planning finalized", time: "Today · 10:20 AM", risk: false },
    { title: "7 change tickets moved to Hold", time: "Today · 08:45 AM", risk: false },
    { title: "SLA breach flagged on AMS rollout", time: "Yesterday · 06:10 PM", risk: true },
  ];

  return (
    <div className="border-t border-(--border) bg-(--background) px-4 sm:px-6 md:px-10 lg:px-14 xl:px-28 2xl:px-40 py-14 xl:pb-20">
      <div className="mb-8 md:mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-(--accent)">
          Delivery intelligence
        </p>
        <p className="text-xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-(--foreground) pt-2">
          Lead your product trajectory
        </p>
        <p className="text-sm text-(--muted-2) max-w-3xl mt-3">
          Track delivery health, execution updates, and SLA signals from the same card-based
          layout you see on the operations dashboard.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard title="Active projects" value="12" subtitle="+3 this month" />
        <MetricCard title="Open incidents" value="48" subtitle="12 high priority" />
        <MetricCard title="Change on hold" value="5" subtitle="SLA paused" />
        <MetricCard title="On-time delivery" value="91%" subtitle="last 30 days" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-(--border) bg-(--surface-2) p-5 shadow-sm">
          <p className="text-base font-semibold text-(--foreground)">Roadmap health</p>
          <p className="text-sm text-(--muted-2) mt-1">Progress by discipline.</p>
          <div className="mt-5 space-y-4">
            {roadmapHealth.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-(--foreground)">{row.label}</p>
                  <p className="text-xs text-(--muted-2) tabular-nums">{row.progress}%</p>
                </div>
                <div className="relative h-2 rounded bg-(--surface-3) border border-(--border)">
                  <div
                    className="absolute top-0 left-0 h-full rounded bg-(--accent)/60"
                    style={{ width: `${row.progress}%` }}
                  />
                  <div
                    className="absolute top-[-2px] h-3 w-0.5 bg-(--accent-2)"
                    style={{ left: `${row.marker}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-(--border) bg-(--surface-2) p-5 shadow-sm">
          <p className="text-base font-semibold text-(--foreground)">Execution updates</p>
          <p className="text-sm text-(--muted-2) mt-1">Latest events across teams.</p>
          <div className="mt-4 space-y-3">
            {recentUpdates.map((item) => (
              <div
                key={item.title}
                className="rounded-md border border-(--border) bg-(--surface-1) px-3 py-2.5"
              >
                <div className="flex items-start gap-x-2">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.risk ? "bg-(--danger)" : "bg-(--success)"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-(--foreground)">{item.title}</p>
                    <p className="text-xs text-(--muted-2) mt-1">{item.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-(--border) bg-(--surface-1) px-3 py-3">
            <p className="text-[10px] uppercase tracking-wide text-(--muted-2)">Next milestone</p>
            <p className="text-sm mt-2 text-(--foreground)">
              Pilot onboarding for engineering and QA teams.
            </p>
            <p className="text-xs mt-1 text-(--muted-2)">Due: May 20</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const MetricCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) => {
  return (
    <div className="rounded-lg border border-(--border) bg-(--surface-2) px-4 py-5 shadow-sm">
      <p className="text-[10px] uppercase tracking-wide text-(--muted-2)">{title}</p>
      <p className="text-2xl md:text-3xl mt-2 font-semibold text-(--foreground) tabular-nums">
        {value}
      </p>
      <p className="text-xs mt-2 text-(--muted)">{subtitle}</p>
    </div>
  );
};
