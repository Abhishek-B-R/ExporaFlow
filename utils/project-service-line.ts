export const PROJECT_SERVICE_LINES = [
  { value: "SAP_CONSULTING", label: "SAP consulting" },
  { value: "ORACLE_CONSULTING", label: "Oracle consulting" },
  { value: "MANAGED_SERVICES", label: "Managed services" },
  { value: "SOFTWARE_DEVELOPMENT", label: "Software development" },
] as const;

export type ProjectServiceLineValue =
  (typeof PROJECT_SERVICE_LINES)[number]["value"];

export const PROJECT_SERVICE_LINE_VALUES: readonly ProjectServiceLineValue[] =
  PROJECT_SERVICE_LINES.map((row) => row.value);

export function isProjectServiceLineValue(
  v: unknown,
): v is ProjectServiceLineValue {
  return (
    typeof v === "string" &&
    (PROJECT_SERVICE_LINE_VALUES as readonly string[]).includes(v)
  );
}

export function projectServiceLineLabel(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const row = PROJECT_SERVICE_LINES.find((s) => s.value === value);
  return row?.label ?? value;
}
