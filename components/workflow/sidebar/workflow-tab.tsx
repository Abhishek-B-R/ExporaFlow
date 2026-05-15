import Image from "next/image";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import applogotwo from "@/public/logo.png";
import Link from "next/link";

export const WorkflowTab = () => {
  return (
    <div className="flex items-center justify-between h-11 px-2 shrink-0 border-b border-(--border) bg-(--surface-1)">
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/"
          className="border border-(--border) w-8 h-8 rounded-md flex items-center justify-center bg-(--surface-2) shadow-sm shrink-0 hover:bg-(--surface-3) transition-colors"
        >
          <Image className="w-5 h-5 object-contain" src={applogotwo} alt="" width={40} height={40} />
        </Link>
        <div className="flex items-center gap-1 min-w-0">
          <Link
            href="/"
            className="text-[13px] font-semibold tracking-tight text-(--foreground) truncate hover:text-(--muted) transition-colors"
          >
            ExporaFlow
          </Link>
          <span className="hidden sm:flex p-1 rounded text-(--muted-2) hover:bg-(--surface-3) hover:text-(--muted) transition-colors">
            <SVGIcon className="flex w-3.5 h-3.5" svgString={RAW_ICONS.ArrowDown} />
          </span>
        </div>
      </div>
    </div>
  );
};
