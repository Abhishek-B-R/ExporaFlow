import { prisma } from "@/db";
import { Role } from "@prisma/client";
import { accessibleProjectsWhere } from "@/lib/project-access";

/** Workspace roles that can see the full customer and employee directory. */
export async function userIsWorkspaceElevated(userId: string): Promise<boolean> {
  const m = await prisma.workspaceMember.findFirst({
    where: { userId, role: { in: [Role.ADMIN, Role.MANAGER] } },
    select: { id: true },
  });
  return !!m;
}

export function parseOrganizationAccess(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string");
  }
  return [];
}

export type DirectoryFilter = "active" | "inactive" | "all";

function activeFilterWhere(filter: DirectoryFilter | undefined) {
  if (filter === "inactive") return { isActive: false };
  if (filter === "all") return {};
  return { isActive: true };
}

/**
 * Customers tied to at least one project the user can access.
 * Elevated workspace members see all customers.
 */
export async function getAccessibleCustomersForUser(
  userId: string,
  options?: { activeOnly?: boolean; status?: DirectoryFilter },
) {
  const status =
    options?.status ?? (options?.activeOnly === false ? "all" : "active");
  const activeWhere = activeFilterWhere(status);

  if (await userIsWorkspaceElevated(userId)) {
    return prisma.customer.findMany({
      where: activeWhere,
      orderBy: { organizationName: "asc" },
    });
  }

  const projectWhere = await accessibleProjectsWhere(userId);
  const rows = await prisma.project.findMany({
    where: {
      ...projectWhere,
      customerId: { not: null },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const ids = [...new Set(rows.map((r) => r.customerId).filter(Boolean))] as string[];
  if (ids.length === 0) return [];

  return prisma.customer.findMany({
    where: { id: { in: ids }, ...activeWhere },
    orderBy: { organizationName: "asc" },
  });
}

/**
 * Employees scoped by organizationAccess JSON (workspace ids) or linked user.
 * Elevated workspace members see all employees.
 */
export async function getAccessibleEmployeesForUser(
  userId: string,
  options?: { activeOnly?: boolean; status?: DirectoryFilter; assignableOnly?: boolean },
) {
  const status =
    options?.status ?? (options?.activeOnly === false ? "all" : "active");
  const activeWhere = activeFilterWhere(status);
  const include = {
    user: { select: { id: true, name: true, email: true } },
    team: { select: { id: true, name: true } },
  } as const;

  if (await userIsWorkspaceElevated(userId)) {
    return prisma.employee.findMany({
      where: activeWhere,
      orderBy: { fullName: "asc" },
      include,
    });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  if (workspaceIds.length === 0) {
    return prisma.employee.findMany({
      where: { userId, ...activeWhere },
      orderBy: { fullName: "asc" },
      include,
    });
  }

  const all = await prisma.employee.findMany({
    where: activeWhere,
    orderBy: { fullName: "asc" },
    include,
  });

  return all.filter((e) => {
    if (e.userId === userId) return true;
    const org = parseOrganizationAccess(e.organizationAccess);
    if (org.length === 0) return false;
    return org.some((id) => workspaceIds.includes(id));
  });
}

export async function canAccessCustomerRecord(userId: string, customerId: string): Promise<boolean> {
  const list = await getAccessibleCustomersForUser(userId);
  return list.some((c) => c.id === customerId);
}

export async function canAccessEmployeeRecord(userId: string, employeeId: string): Promise<boolean> {
  const list = await getAccessibleEmployeesForUser(userId);
  return list.some((e) => e.id === employeeId);
}
