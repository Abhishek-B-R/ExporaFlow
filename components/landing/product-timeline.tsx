export default function ProductTimeline() {
  const roadmapHealth = [
    { label: "Research", progress: 82, marker: 76 },
    { label: "Design", progress: 68, marker: 64 },
    { label: "Development", progress: 54, marker: 58 },
    { label: "QA", progress: 44, marker: 39 },
  ];

  const recentUpdates = [
    { title: "Sprint 4 planning finalized", time: "Today · 10:20 AM" },
    { title: "7 issues moved to In Progress", time: "Today · 08:45 AM" },
    { title: "Risk flag raised for API latency", time: "Yesterday · 06:10 PM" },
  ];

  return (
    <div className="bg-gradient-to-b from-[#151515] via-[#0f1011] to-[#0A0A0A] px-4 sm:px-6 md:px-10 lg:px-14 xl:px-28 2xl:px-40 py-10 xl:pb-24">
      <div className="mb-7 md:mb-10">
        <div className="flex items-center gap-x-2 text-xs md:text-sm text-[#A8A8A8]">
          <p>Single platform to drive your product</p>
          <div className="w-3 h-3 rotate-45 rounded border border-[#556183] bg-[#1a223a]" />
        </div>
        <p className="text-xl md:text-3xl lg:text-4xl xl:text-6xl font-medium pt-2 md:pt-3">
          Lead your product trajectory
        </p>
        <p className="text-xs md:text-[16px] lg:text-lg text-[#A8A8A8] max-w-3xl mt-3">
          Track delivery health, recent execution updates, and sprint risk
          hotspots from one operational view.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard title="Active Projects" value="12" subtitle="+3 this month" />
        <MetricCard title="Open Issues" value="148" subtitle="27 high priority" />
        <MetricCard title="Sprint Velocity" value="34 pts" subtitle="up 18%" />
        <MetricCard title="On-time Delivery" value="91%" subtitle="last 30 days" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#2b2f39] bg-gradient-to-b from-[#11141d] to-[#0b0d14] p-5">
          <p className="text-lg md:text-xl font-medium">Roadmap health</p>
          <p className="text-sm text-[#98a1b7] mt-1">
            Progress and quality signal by discipline.
          </p>
          <div className="mt-5 space-y-4">
            {roadmapHealth.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-[#d9deea]">{row.label}</p>
                  <p className="text-xs text-[#9aa5c2]">{row.progress}%</p>
                </div>
                <div className="relative h-2.5 rounded bg-[#1b2030] border border-[#2e3446]">
                  <div
                    className="absolute top-0 left-0 h-full rounded bg-gradient-to-r from-[#31d09f] to-[#44e1af]"
                    style={{ width: `${row.progress}%` }}
                  />
                  <div
                    className="absolute top-[-3px] h-4 w-[2px] bg-[#e7ecff]"
                    style={{ left: `${row.marker}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#2b2f39] bg-gradient-to-b from-[#11141d] to-[#0b0d14] p-5">
          <p className="text-lg md:text-xl font-medium">Execution updates</p>
          <p className="text-sm text-[#98a1b7] mt-1">
            Latest progress events across teams.
          </p>
          <div className="mt-4 space-y-3">
            {recentUpdates.map((item, idx) => (
              <div
                key={item.title}
                className="rounded-xl border border-[#2f3443] bg-[#0e1320] px-3 py-2"
              >
                <div className="flex items-start gap-x-2">
                  <span
                    className={`mt-1 h-2 w-2 rounded-full ${
                      idx === 2 ? "bg-[#ff8b8b]" : "bg-[#4be1a6]"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-[#e5e9f5]">{item.title}</p>
                    <p className="text-xs text-[#9099b4] mt-1">{item.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[#2f3443] bg-[#0e1320] px-3 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[#8f98b5]">
              Next Milestone
            </p>
            <p className="text-sm mt-2 text-[#e5e9f5]">
              Launch pilot onboarding for engineering and QA teams.
            </p>
            <p className="text-xs mt-1 text-[#9099b4]">Due: May 20</p>
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
    <div className="rounded-2xl border border-[#2b2f39] bg-gradient-to-b from-[#10131b] to-[#0a0d13] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[#8f98b5]">{title}</p>
      <p className="text-2xl md:text-3xl mt-2 font-semibold text-[#f2f4fb]">{value}</p>
      <p className="text-xs md:text-sm mt-2 text-[#9ba3bb]">{subtitle}</p>
    </div>
  );
};
