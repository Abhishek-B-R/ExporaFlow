"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Install date-fns for formatting — lightweight subset */
function fmt(d: Date) {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EnterpriseDatePicker(props: {
  id?: string;
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { id, label, value, onChange, disabled, className } = props;
  const selected = value ? new Date(`${value}T12:00:00.000Z`) : undefined;
  const valid = selected && !Number.isNaN(selected.getTime());

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={id} className="text-xs font-medium text-(--muted)">
          {label}
        </label>
      ) : null}
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full min-h-11 justify-start text-left font-normal text-sm px-3 py-2.5 rounded-md border border-(--border) bg-(--surface-1) hover:bg-(--surface-2) shadow-sm pointer-events-auto",
              !valid && "text-(--muted-2)",
            )}
          >
            <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
            {valid ? fmt(selected!) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[110] w-auto p-0 border-(--border) bg-(--surface-1) shadow-lg pointer-events-auto"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
            mode="single"
            selected={valid ? selected : undefined}
            onSelect={(d) => {
              if (!d) {
                onChange("");
                return;
              }
              onChange(d.toISOString().slice(0, 10));
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
