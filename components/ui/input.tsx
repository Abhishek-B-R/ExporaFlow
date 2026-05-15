import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-(--border) bg-(--surface-1) px-3 py-1 text-sm text-(--foreground) shadow-xs",
        "placeholder:text-(--muted-2) focus-visible:border-[color:var(--accent)] focus-visible:ring-[color:var(--accent)]/25 focus-visible:ring-[3px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
