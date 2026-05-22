"use client";

import {
  isProjectServiceLineValue,
  PROJECT_SERVICE_LINES,
  type ProjectServiceLineValue,
} from "@/utils/project-service-line";

type ServiceLineSelectProps = {
  value: ProjectServiceLineValue | null;
  onChange: (value: ProjectServiceLineValue) => void;
  id?: string;
  className?: string;
};

export function ServiceLineSelect({
  value,
  onChange,
  id = "service-line",
  className = "",
}: ServiceLineSelectProps) {
  return (
    <select
      id={id}
      className={
        className ||
        "ef-field w-full text-sm px-3 py-2 outline-none min-w-0 cursor-pointer"
      }
      value={value ?? ""}
      onChange={(e) => {
        const next = e.target.value;
        if (isProjectServiceLineValue(next)) onChange(next);
      }}
      required
    >
      <option value="" disabled>
        Select a service line…
      </option>
      {PROJECT_SERVICE_LINES.map((line) => (
        <option key={line.value} value={line.value}>
          {line.label}
        </option>
      ))}
    </select>
  );
}
