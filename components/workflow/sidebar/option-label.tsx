import SVGIcon from "@/lib/svg-icon";
import Link from "next/link";

export default function OptionLabel({
  svg,
  optName,
  className,
  href,
}: {
  svg: string;
  optName: string;
  className?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="">
        <SVGIcon className="flex w-4" svgString={svg} />
      </div>
      <p className="text-sm">{optName}</p>
    </>
  );

  const cls = `${className} cursor-pointer h-8 flex px-3 rounded-md items-center gap-x-2 hover:bg-(--surface-3) transition-colors`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cls}>
      {content}
    </div>
  );
}
