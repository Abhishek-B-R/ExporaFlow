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
      {lastUsed ? (
        <span className="absolute -right-1 -top-2 text-[10px] py-0.5 px-1.5 rounded-md border border-(--border) bg-(--surface-2) text-(--muted-2) font-medium">
          Last used
        </span>
      ) : null}
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
        className="w-full border border-(--border) h-11 rounded-lg bg-(--surface-1) text-sm font-medium text-(--foreground) hover:border-(--border-strong) hover:bg-(--surface-2) transition-colors"
      >
        {btnTitle}
      </button>
    </div>
  );
}
