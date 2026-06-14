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
    <div className="border-t border-(--border) bg-(--background) ef-page-gutter py-16 xl:pb-20">
      <p className="ef-kicker">Delivery intelligence</p>
      <h2 className="ef-section-title mt-2">Portfolio at a glance</h2>
      <p className="ef-section-lead mt-3">
        Track delivery health, execution updates, and SLA signals from the same layout as your dashboard.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-10 mb-6">
        <MetricCard title="Active projects" value="12" subtitle="+3 this month" />
        <MetricCard title="Open incidents" value="48" subtitle="12 high priority" />
        <MetricCard title="Change on hold" value="5" subtitle="SLA paused" />
        <MetricCard title="On-time delivery" value="91%" subtitle="last 30 days" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="ef-card p-5">
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

        <div className="ef-card p-5">
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

          <div className="mt-4 rounded-lg border border-(--border) bg-(--surface-2) px-3 py-3">
            <p className="text-xs font-medium text-(--muted-2)">Next milestone</p>
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
    <div className="ef-metric">
      <p className="ef-metric-label">{title}</p>
      <p className="ef-metric-value text-2xl md:text-3xl">{value}</p>
      <p className="text-xs mt-1.5 text-(--muted)">{subtitle}</p>
    </div>
  );
};
