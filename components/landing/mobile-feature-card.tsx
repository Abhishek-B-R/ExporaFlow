"use client";

import type { FeatureItem } from "@/utils/features-array";
import { Building2, Kanban, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<FeatureItem["icon"], LucideIcon> = {
  tickets: Ticket,
  store: Building2,
  delivery: Kanban,
};

export const MobileFeatureCard = ({ feature }: { feature: FeatureItem }) => {
  const Icon = ICONS[feature.icon];
  const headingId = `heading-${feature.heading.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="ef-card h-full p-5 flex flex-col" role="article" aria-labelledby={headingId}>
      <div className="h-9 w-9 rounded-lg bg-(--surface-3) flex items-center justify-center text-(--accent)">
        <Icon className="size-4" strokeWidth={2} />
      </div>
      <h3 id={headingId} className="text-base font-semibold text-(--foreground) mt-4 tracking-tight">
        {feature.heading}
      </h3>
      <p className="text-sm text-(--muted-2) mt-2 leading-relaxed flex-1">{feature.description}</p>
      <ul className="mt-4 pt-4 border-t border-(--border) space-y-1.5">
        {feature.highlights.map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-(--muted)">
            <span className="h-1 w-1 rounded-full bg-(--accent) shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};
