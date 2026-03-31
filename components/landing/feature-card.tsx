"use client";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";

export const FeatureCard = ({
  heading,
  description,
}: {
  img?: string;
  heading?: string;
  description?: string;
}) => {
  const highlights = [
    "Role-aware access",
    "Status automation",
    "Audit-safe actions",
  ];

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl cursor-pointer border border-[#1f2a45] bg-gradient-to-b from-[#0f1730] via-[#0b1226] to-[#090f20] hover:border-[#334a7a] transition-all duration-300 p-5">
      <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[#4be1a6]/12 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-[#7c5cff]/12 blur-2xl" />

      <div className="relative z-10 h-full flex flex-col">
        <div className="h-10 w-10 rounded-xl border border-[#29406d] bg-[#0a1226] flex items-center justify-center">
          <SVGIcon className="w-5" svgString={RAW_ICONS.Stack} />
        </div>
        <h3 className="text-white text-xl font-semibold mt-4">{heading}</h3>
        <p className="text-[#b9c5e8] text-sm mt-2 leading-relaxed">{description}</p>

        <div className="mt-auto pt-4 space-y-2">
          {highlights.map((item) => (
            <div key={`${heading}-${item}`} className="flex items-center gap-x-2 text-xs text-[#93a7d9]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4be1a6]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
