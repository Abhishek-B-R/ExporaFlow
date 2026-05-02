import Image from "next/image";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import applogotwo from "@/public/logo.png";
import Link from "next/link";

export const WorkflowTab = () => {
  return (
    <div className="flex item-center justify-between h-14 px-2 cursor-pointer">
      <div className="flex items-center gap-x-2 ">
        <Link
          href={"/"}
          className="border border-(--border) w-8 h-8 rounded-lg flex items-center justify-center bg-(--surface-2)"
        >
          <Image
            className=" w-6"
            src={applogotwo}
            alt=""
            width={100}
            height={100}
          />
        </Link>
        <div className="flex gap-x-1 items-center">
          <Link href={"/"} className="text-sm font-semibold tracking-tight">
            ExporaFlow
          </Link>
          <div className="w-4 h-4 flex items-center justify-center cursor-pointer rounded hover:bg-(--surface-3)">
            <SVGIcon className="flex w-4" svgString={RAW_ICONS.ArrowDown} />
          </div>
        </div>
      </div>
    </div>
  );
};
