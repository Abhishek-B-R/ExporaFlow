export type ProjectBody = {
  title: string;
  content: string;
  createdBy: string;
  description: string;
  health: string;
  id: string;
  lead: string;
  priority: string;
  status: string;
  targetDate: any;
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
  sprintId?: string | null;
  parentIssueId?: string | null;
  projectId: string;
  updatedAt: string | undefined;
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
