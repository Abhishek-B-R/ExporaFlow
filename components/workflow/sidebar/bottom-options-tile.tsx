"use client";
import { customToast } from "@/lib/custom-toast";
import { RAW_ICONS } from "@/lib/icons";
import SVGIcon from "@/lib/svg-icon";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { title } from "process";
import { useState } from "react";
import { toast } from "sonner";

const optionsArr: {
  title: string;
  svg: string;
  redirectHref: string;
  openToNewPage: boolean;
}[] = [
  {
    title: "Profile",
    svg: RAW_ICONS.User,
    redirectHref: "/profile",
    openToNewPage: false,
  },
  {
    title: "Search for help…",
    svg: RAW_ICONS.Search,
    redirectHref: "",
    openToNewPage: false,
  },
  {
    title: "Shortcuts",
    svg: RAW_ICONS.Keyboard,
    redirectHref: "",
    openToNewPage: false,
  },
  { title: "Docs", svg: RAW_ICONS.Docs, redirectHref: "", openToNewPage: true },
  {
    title: "Contact us",
    svg: RAW_ICONS.ContactUs,
    redirectHref: "",
    openToNewPage: false,
  },
  {
    title: "Community",
    svg: RAW_ICONS.Community,
    redirectHref: "",
    openToNewPage: true,
  },
];

export const BottomOptionsTile = () => {
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <>
      {/* Options Button */}
      <div
        className="flex border w-8 h-8 items-center justify-center cursor-pointer rounded-full absolute bottom-2 md:bottom-4 left-4 border-(--border) hover:bg-(--surface-3) transition-all duration-300"
        onClick={() => setOptionsOpen(!optionsOpen)} // Toggle popup visibility
      >
        <SVGIcon className="flex w-5" svgString={RAW_ICONS.Gliter} />
      </div>

      {/* Popup */}
      <div
        className={`absolute bottom-16 left-4 w-52 h-fit bg-[rgba(0,0,0,0.1)] backdrop-blur-lg border border-(--border) rounded-xl shadow-lg p-1 transition-all duration-300 ${
          optionsOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {optionsArr.map((elem, key) => {
          return (
            <BottomOptionLabel
              key={key}
              svg={elem.svg}
              title={elem.title}
              redirectHref={elem.redirectHref}
              openToNewPage={elem.openToNewPage}
            />
          );
        })}
        <LogoutBtn />
      </div>
    </>
  );
};

export const BottomOptionLabel = ({
  title,
  svg,
  redirectHref,
  openToNewPage,
}: {
  title: string;
  svg: string;
  redirectHref: string;
  openToNewPage: boolean;
}) => {
  return (
    <Link
      href={redirectHref}
      target={openToNewPage ? "_blank" : "_self"}
      className="rounded-lg flex items-center h-9 px-2 gap-x-2 hover:bg-(--surface-3) transition-all duration-300 border border-transparent hover:border-(--border) text-(--foreground)"
    >
      <SVGIcon className="flex w-4" svgString={svg} />
      <p>{title}</p>
      {openToNewPage && (
        <SVGIcon className="flex w-4" svgString={RAW_ICONS.Arrow45} />
      )}
    </Link>
  );
};

export const LogoutBtn = () => {
  const [signoutLoading, setSignoutLoading] = useState(false);
  const handleSignout = () => {
    try {
      setSignoutLoading(true);
      signOut();
    } catch (error) {
      customToast.error({
        title: "",
        description: `Error occured: ${error}`,
      });
    } finally {
      setSignoutLoading(false);
      customToast.info({
        title: "Logged out",
        description: `To access your workspace, log in again.`,
      });
    }
  };
  return (
    <div
      onClick={handleSignout}
      className="rounded-lg flex items-center h-9 px-2 gap-x-2 hover:bg-red-50 transition-all duration-300 border border-red-300 bg-red-50/80 text-red-800 hover:border-red-400 cursor-pointer"
    >
      <SVGIcon className="flex w-4" svgString={RAW_ICONS.Logout} />
      <p>Log out</p>
    </div>
  );
};
