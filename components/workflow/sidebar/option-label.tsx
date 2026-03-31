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
        <SVGIcon className="flex w-5" svgString={svg} />
      </div>
      <p className="">{optName}</p>
    </>
  );

  const cls = `${className} cursor-pointer h-8 flex px-4 rounded items-center gap-x-2 hover:bg-[#1d1d21] transition-all duration-200`;

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
