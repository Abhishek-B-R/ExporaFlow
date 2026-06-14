import { z } from "zod";
import { TicketType, TicketUrgency } from "@prisma/client";
import { isChangeManagementType } from "@/lib/ticket-types";

/** ISO date `YYYY-MM-DD` or full ISO datetime string. */
const dateString = z
  .string()
  .trim()
  .min(1)
  .refine(
    (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isNaN(Date.parse(s)),
    "Invalid date",
  );

const optionalDate = z.union([dateString, z.literal(""), z.null()]).optional();

export const cloudinaryMediaSchema = z.object({
  publicId: z.string().trim().min(1),
  secureUrl: z.string().url(),
  resourceType: z.string().trim().min(1),
  bytes: z.number().int().nonnegative().optional(),
  originalFilename: z.string().optional(),
  format: z.string().optional(),
});

export const createIssueBodySchema = z
  .object({
    ticketType: z.nativeEnum(TicketType),
    issueTitle: z.string().trim().min(1, "Title is required"),
    issueDescription: z.string().optional(),
    issueStatus: z.string().optional(),
    issuePriority: z.string().optional(),
    projectId: z.string().min(1),
    dueDate: optionalDate,
    labels: z.array(z.string()).optional(),
    parentIssueId: z.string().nullable().optional(),
    assignedUser: z.union([z.string(), z.null()]).optional(),
    urgency: z.nativeEnum(TicketUrgency).optional(),
    requesterName: z.string().trim().min(1).optional(),
    requesterEmail: z.string().email().optional().or(z.literal("")),
    startDate: optionalDate,
    endDate: optionalDate,
    durationMinutes: z.number().int().positive().nullable().optional(),
    cloudinaryMedia: z.array(cloudinaryMediaSchema).max(8).optional(),
  })
  .superRefine((data, ctx) => {
    if (!isChangeManagementType(data.ticketType)) return;
    const start = data.startDate;
    const hasStart =
      typeof start === "string" && start.length > 0 && start !== "";
    if (!hasStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required for change management tickets.",
        path: ["startDate"],
      });
    }
    const end = data.endDate;
    const hasEnd = typeof end === "string" && end.length > 0 && end !== "";
    const hasDuration =
      typeof data.durationMinutes === "number" && data.durationMinutes > 0;
    if (!hasEnd && !hasDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Provide an end date or a duration for change management tickets.",
        path: ["endDate"],
      });
    }
  });

export type CreateIssueBody = z.infer<typeof createIssueBodySchema>;

export const updateIssueBodySchema = z.object({
  issueId: z.string().min(1),
  issueTitle: z.string().optional(),
  issueDescription: z.string().optional(),
  issuePriority: z.string().optional(),
  issueStatus: z.string().optional(),
  assignedUser: z.union([z.string(), z.null()]).optional(),
  parentIssueId: z.union([z.string(), z.null()]).optional(),
  sprintId: z.union([z.string(), z.null()]).optional(),
  dueDate: z.union([z.string(), z.null()]).optional(),
  labels: z.array(z.string()).optional(),
  estimate: z.union([z.number(), z.null()]).optional(),
  startDate: optionalDate,
  endDate: optionalDate,
  durationMinutes: z.number().int().positive().nullable().optional(),
  ticketType: z.nativeEnum(TicketType).optional(),
  urgency: z.nativeEnum(TicketUrgency).optional(),
  requesterName: z.union([z.string(), z.null()]).optional(),
  requesterEmail: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  manualDueDateOverride: z.boolean().optional(),
});
