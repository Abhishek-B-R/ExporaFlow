/** ISO date strings `YYYY-MM-DD` excluded from business-day counts. */
export const DEFAULT_BUSINESS_HOLIDAYS: string[] = [];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function isBusinessHoliday(
  date: Date,
  holidays: readonly string[] = DEFAULT_BUSINESS_HOLIDAYS,
): boolean {
  return holidays.includes(toDateKey(date));
}

export function isBusinessDay(
  date: Date,
  holidays: readonly string[] = DEFAULT_BUSINESS_HOLIDAYS,
): boolean {
  return !isWeekend(date) && !isBusinessHoliday(date, holidays);
}

/** Add calendar hours (used for short SLA windows). */
export function addCalendarHours(start: Date, hours: number): Date {
  return new Date(start.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Add whole business days, skipping weekends and configured holidays.
 * The start instant is preserved; counting begins on the next business day when days > 0.
 */
export function addBusinessDays(
  start: Date,
  days: number,
  holidays: readonly string[] = DEFAULT_BUSINESS_HOLIDAYS,
): Date {
  if (days <= 0) return new Date(start);
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (isBusinessDay(result, holidays)) remaining -= 1;
  }
  return result;
}
