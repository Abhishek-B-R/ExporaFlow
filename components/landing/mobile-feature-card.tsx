"use client";

import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";

export const MobileFeatureCard = ({
  heading,
  description,
}: {
  img?: string;
  heading?: string;
  description?: string;
}) => {
  const headingId = heading
    ? `heading-${heading.replace(/\s+/g, "-").toLowerCase()}`
    : "feature-heading";

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-lg border border-(--border) bg-(--surface-2) p-5 shadow-sm"
      role="article"
      aria-labelledby={headingId}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="h-10 w-10 rounded-md border border-(--border) bg-(--surface-1) flex items-center justify-center text-(--accent)">
          <SVGIcon className="w-5" svgString={RAW_ICONS.Stack} />
        </div>
        <h3 id={headingId} className="text-(--foreground) text-xl font-semibold mt-4">
          {heading || "Upcoming feature…"}
        </h3>
        <p className="text-(--muted-2) text-sm mt-2 leading-relaxed">{description || ""}</p>

        <div className="mt-auto pt-4 space-y-2">
          {["Role-aware access", "Status automation", "Audit-safe actions"].map((item) => (
            <div key={item} className="flex items-center gap-x-2 text-xs text-(--muted)">
              <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
