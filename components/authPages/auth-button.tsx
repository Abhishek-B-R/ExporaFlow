"use client";

import { toast } from "sonner";
import React from "react";
import { customToast } from "@/lib/custom-toast";

export default function AuthButton({
  btnTitle,
  btnbg,
  btnHoverBg,
  working,
  handleOnClickFunction,
  lastUsed
}: {
  btnTitle: string;
  btnbg?: string;
  btnHoverBg?: string;
  working?: boolean;
  handleOnClickFunction?:
  | React.MouseEventHandler<HTMLButtonElement>
  | undefined;
  lastUsed?: boolean
}) {
  return (
    <div className="relative">
      {lastUsed == true && <span className="absolute -right-2 md:-right-3 -top-2 border border-(--border) text-xs py-px px-2 rounded-lg bg-(--surface-2) text-(--muted-2) font-medium">last used</span>}
      <button
        onClick={
          working
            ? handleOnClickFunction
            : () =>
              customToast.info({
                title: "Action unavailable!",
                description: `Auth option is unavailable right now, try others.`,
              })
        }
        className="w-full border border-(--border) h-14 rounded-lg bg-(--surface-1) text-(--foreground) hover:border-(--border-strong) hover:bg-(--surface-3) transition-all duration-200"
      >
        {btnTitle}
      </button>
    </div>
  );
}
