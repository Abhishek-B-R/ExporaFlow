import SVGIcon from "@/lib/svg-icon";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function OptionLabel({
  svg,
  Lucide,
  optName,
  className,
  href,
}: {
  svg?: string;
  Lucide?: LucideIcon;
  optName: string;
  className?: string;
  href?: string;
}) {
  const icon =
    Lucide != null ? (
      <Lucide className="size-[15px] shrink-0 text-(--muted-2) group-hover:text-(--muted) transition-colors" />
    ) : svg != null ? (
      <span className="text-(--muted-2) group-hover:text-(--muted) [&>div]:flex transition-colors">
        <SVGIcon className="flex w-[15px] h-[15px]" svgString={svg} />
      </span>
    ) : null;

  const content = (
    <>
      {icon}
      <span className="text-[13px] leading-none font-medium tracking-tight truncate">{optName}</span>
    </>
  );

  const base =
    "group w-full min-h-[32px] h-8 flex px-2.5 gap-2 rounded-lg items-center transition-colors duration-150 " +
    "text-(--foreground) hover:bg-(--surface-3) active:bg-(--surface-3)";

  const cls = `${base} ${className ?? ""}`.trim();

  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }

  return <div className={cls}>{content}</div>;
}
