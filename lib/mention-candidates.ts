import { prisma } from "@/db";
import { getAccessibleEmployeesForUser } from "@/lib/store-access";
import { resolveMentionedUserIds } from "@/lib/collaboration";

export type MentionCandidate = {
  id: string;
  email?: string | null;
  username?: string | null;
  name?: string | null;
};

export async function loadMentionCandidatesForProject(
  projectId: string,
  actorUserId: string,
): Promise<MentionCandidate[]> {
  const projectUsers = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      creator: {
        select: { id: true, name: true, email: true, username: true },
      },
      projectMembers: {
        select: {
          user: {
            select: { id: true, name: true, email: true, username: true },
          },
        },
      },
    },
  });

  const mentionCandidates: MentionCandidate[] = [
    ...(projectUsers?.creator ? [projectUsers.creator] : []),
    ...(projectUsers?.projectMembers.map((member) => member.user) ?? []),
  ];

  const storeEmployees = await getAccessibleEmployeesForUser(actorUserId, {
    activeOnly: true,
  });
  const emailsNeedingLookup = new Set<string>();

  for (const emp of storeEmployees) {
    if (emp.user) {
      mentionCandidates.push({
        ...emp.user,
        username: emp.user.email?.includes("@")
          ? emp.user.email.split("@")[0]
          : null,
      });
      continue;
    }
    if (emp.email) emailsNeedingLookup.add(emp.email.toLowerCase());
    mentionCandidates.push({
      id: emp.userId ?? emp.email,
      name: emp.fullName,
      email: emp.email,
      username: emp.email.includes("@") ? emp.email.split("@")[0] : null,
    });
  }

  if (emailsNeedingLookup.size > 0) {
    const usersByEmail = await prisma.user.findMany({
      where: { email: { in: [...emailsNeedingLookup], mode: "insensitive" } },
      select: { id: true, name: true, email: true, username: true },
    });
    for (const user of usersByEmail) mentionCandidates.push(user);
  }

  return mentionCandidates;
}

export function diffNewMentionIds(params: {
  previousText: string | null | undefined;
  nextText: string;
  candidates: MentionCandidate[];
}): string[] {
  const previous = new Set(
    resolveMentionedUserIds(params.previousText ?? "", params.candidates),
  );
  const next = resolveMentionedUserIds(params.nextText, params.candidates);
  return next.filter((id) => !previous.has(id));
}
