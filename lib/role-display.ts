import { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  ENGINEER: "Engineer",
  QA: "QA",
  VIEWER: "Viewer",
  CUSTOMER: "Customer",
};

export function roleDisplayName(role: Role | null | undefined) {
  if (!role) return "No access";
  return ROLE_LABELS[role] ?? role;
}

export function roleBadgeClass(role: Role | null | undefined) {
  switch (role) {
    case Role.ADMIN:
      return "border-red-300 bg-red-50 text-red-800";
    case Role.MANAGER:
      return "border-amber-300 bg-amber-50 text-amber-900";
    case Role.ENGINEER:
      return "border-sky-300 bg-sky-50 text-sky-800";
    case Role.QA:
      return "border-violet-300 bg-violet-50 text-violet-800";
    case Role.VIEWER:
      return "border-slate-300 bg-slate-100 text-slate-700";
    case Role.CUSTOMER:
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    default:
      return "border-(--border) bg-(--surface-2) text-(--muted)";
  }
}
