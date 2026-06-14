export function isTicketOverdue(params: {
  dueDate: Date | string | null | undefined;
  status?: string | null;
  now?: Date;
}): boolean {
  if (!params.dueDate) return false;
  const closed = ["Completed", "Cancelled"].includes(params.status ?? "");
  if (closed) return false;
  const due =
    params.dueDate instanceof Date
      ? params.dueDate
      : new Date(params.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const now = params.now ?? new Date();
  return due.getTime() < now.getTime();
}

export function slaCountdownLabel(params: {
  dueDate: Date | string | null | undefined;
  now?: Date;
}): string | null {
  if (!params.dueDate) return null;
  const due =
    params.dueDate instanceof Date
      ? params.dueDate
      : new Date(params.dueDate);
  if (Number.isNaN(due.getTime())) return null;

  const now = params.now ?? new Date();
  const diffMs = due.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (diffMs >= 0) {
    if (days >= 1) return `${days}d left`;
    if (hours >= 1) return `${hours}h left`;
    return "<1h left";
  }
  if (days >= 1) return `${days}d overdue`;
  if (hours >= 1) return `${hours}h overdue`;
  return "Overdue";
}
