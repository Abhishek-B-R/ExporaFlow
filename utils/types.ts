export type ProjectBody = {
  title: string;
  content: string;
  createdBy: string;
  description: string;
  health: string;
  id: string;
  lead: string;
  priority: string;
  /** Company service line; optional on legacy projects. */
  serviceLine?: string | null;
  customerId?: string | null;
  status: string;
  startDate?: string | Date | null;
  targetDate?: string | Date | null;
  creator?: { name: string | null; email: string | null } | null;
  stats?: {
    incidentTickets: number;
    changeTickets: number;
    slaAtRisk: number;
  };
};

export type IssueBody = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  labels?: string[];
  assignedUser?: string | null;
  User?: { id: string; name?: string | null; email?: string | null; image?: string | null } | null;
  sprintId?: string | null;
  parentIssueId?: string | null;
  projectId: string;
  updatedAt: string | undefined;
  estimate?: number | null;
  ticketType?: "INCIDENT" | "CHANGE";
  ticketNumber?: number;
  urgency?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requesterName?: string | null;
  requesterUserId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationMinutes?: number | null;
  slaDueAt?: string | null;
};

export type SprintBody = {
  id: string;
  name: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  projectId: string;
};

export type User = {
  id: string;
  name?: string;
  email: string;
  username?: string;
  emailVerified: Date;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
  Project: ProjectBody;
  projectId: string;
  createdProjects: ProjectBody[];
  Issue: IssueBody[];
};

export type ProjectStatusType =
  | "Completed"
  | "Backlog"
  | "Working"
  | "Cancelled"
  | "Planned";

export type ProjectPriorityType =
  | "No Priority"
  | "Urgent"
  | "High"
  | "Medium"
  | "Low";
