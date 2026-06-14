import Image from "next/image";
import applogotwo from "@/public/logo.png";
import Link from "next/link";

export const WorkflowTab = () => {
  return (
    <div className="flex items-center justify-between h-11 px-3 shrink-0 border-b border-(--border) bg-(--surface-1)">
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          href="/"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-(--surface-2) shrink-0 hover:bg-(--surface-3) transition-colors"
        >
          <Image className="w-5 h-5 object-contain" src={applogotwo} alt="" width={40} height={40} />
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-(--foreground) truncate hover:text-(--muted) transition-colors"
        >
          ExporaFlow
        </Link>
      </div>
    </div>
  );
};
