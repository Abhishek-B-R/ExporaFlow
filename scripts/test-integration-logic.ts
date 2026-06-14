import assert from "node:assert/strict";
import { prisma } from "../db";
import {
  diffNewMentionIds,
  type MentionCandidate,
} from "../lib/mention-candidates";
import { rowsToCsv, mapIssueToExportRow } from "../lib/export-tickets";
import { isChangeManagementType } from "../lib/ticket-types";
import { TicketType } from "@prisma/client";
import { isTicketOverdue, slaCountdownLabel } from "../lib/sla-countdown";

async function main() {
  const candidates: MentionCandidate[] = [
    { id: "user-a", username: "alice", email: "alice@test.com", name: "Alice" },
    { id: "user-b", username: "bob", email: "bob@test.com", name: "Bob" },
  ];

  const newOnly = diffNewMentionIds({
    previousText: "Hello @alice",
    nextText: "Hello @alice and @bob",
    candidates,
  });
  assert.deepEqual(newOnly, ["user-b"]);

  const noneNew = diffNewMentionIds({
    previousText: "Hey @bob",
    nextText: "Hey @bob again",
    candidates,
  });
  assert.equal(noneNew.length, 0);

  assert.equal(isChangeManagementType(TicketType.CHANGE), true);
  assert.equal(isChangeManagementType(TicketType.CHANGE_REQUEST), true);
  assert.equal(isChangeManagementType(TicketType.BUG), false);

  const overdue = isTicketOverdue({
    dueDate: new Date("2020-01-01"),
    status: "Working",
  });
  assert.equal(overdue, true);

  const notOverdue = isTicketOverdue({
    dueDate: new Date("2099-01-01"),
    status: "Working",
  });
  assert.equal(notOverdue, false);

  const countdown = slaCountdownLabel({
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
  });
  assert.match(countdown ?? "", /left/);

  const issue = await prisma.issue.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      User: { select: { name: true, email: true } },
      Project: {
        select: {
          title: true,
          customer: { select: { organizationName: true, name: true } },
        },
      },
    },
  });

  if (issue) {
    const row = mapIssueToExportRow(issue);
    assert.ok(row.ticketNumber.length > 0);
    assert.ok(row.title.length > 0);
    const csv = rowsToCsv([row]);
    assert.ok(csv.includes("ticketNumber"));
    assert.ok(csv.includes(row.title));
  }

  const seq = await prisma.globalTicketSequence.findUnique({
    where: { id: "singleton" },
  });
  assert.ok(seq);
  assert.ok(seq.lastNumber >= 0);

  const withGlobal = await prisma.issue.count({
    where: { globalTicketNumber: { not: null } },
  });
  assert.ok(withGlobal >= 0);

  console.log("Integration logic tests passed.", {
    issuesWithGlobalNumber: withGlobal,
    sequence: seq.lastNumber,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
