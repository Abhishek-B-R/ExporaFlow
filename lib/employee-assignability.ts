import { prisma } from "@/db";

/** Resolve a platform user id for an employee record (explicit link or email match). */
export async function resolveEmployeeUserId(params: {
  employeeId: string;
  email: string;
  userId?: string | null;
}): Promise<string | null> {
  if (params.userId) return params.userId;

  const user = await prisma.user.findFirst({
    where: { email: { equals: params.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) return null;

  await prisma.employee.update({
    where: { id: params.employeeId },
    data: { userId: user.id },
  });

  return user.id;
}

export type EmployeeDirectoryRow = {
  id: string;
  fullName: string;
  email: string;
  userId?: string | null;
  isActive?: boolean;
  user?: { id: string; name?: string | null; email?: string | null } | null;
};

/** Attach `assignableUserId` for project assignment (links by email when possible). */
export async function enrichEmployeesForAssignment<
  T extends EmployeeDirectoryRow,
>(employees: T[]) {
  const unlinked = employees.filter((e) => !e.userId);
  const emails = unlinked.map((e) => e.email.toLowerCase());

  const usersByEmail = new Map<string, string>();
  if (emails.length > 0) {
    const users = await prisma.user.findMany({
      where: { email: { in: emails, mode: "insensitive" } },
      select: { id: true, email: true },
    });
    for (const user of users) {
      if (user.email) usersByEmail.set(user.email.toLowerCase(), user.id);
    }
  }

  return employees.map((employee) => {
    const emailKey = employee.email.toLowerCase();
    const matchedByEmail = usersByEmail.get(emailKey) ?? null;
    const matched =
      employee.userId ??
      employee.user?.id ??
      matchedByEmail ??
      null;

    if (!employee.userId && matchedByEmail) {
      void prisma.employee
        .update({
          where: { id: employee.id },
          data: { userId: matchedByEmail },
        })
        .catch(() => undefined);
    }

    return {
      ...employee,
      assignableUserId: matched,
    };
  });
}
