/**
 * Date utilities for the habit tracker.
 * All dates are strings in "YYYY-MM-DD" format to match entry keys.
 */

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

export function getMonthName(month: number): string {
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][month];
}

export function getShortMonthName(month: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
}

export function getDayOfWeekName(day: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
}

export function getDayOfWeekLetter(day: number): string {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][day];
}

/** Get Sunday-based calendar week number. Jan 1 is always week 1. */
export function getSundayWeekNumber(date: Date): number {
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - jan1.getTime()) / 86400000) + 1;
  const jan1DayOfWeek = jan1.getDay(); // 0=Sun
  return Math.floor((dayOfYear - 1 + jan1DayOfWeek) / 7) + 1;
}

/** Get the ISO week number */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/** Get all dates in a given week (Sun–Sat), given any date in that week */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const wd = new Date(start);
    wd.setDate(start.getDate() + i);
    dates.push(wd);
  }
  return dates;
}

/** Get all dates in a year, month by month */
export function getYearMonths(year: number): Date[][] {
  const months: Date[][] = [];
  for (let m = 0; m < 12; m++) {
    const days: Date[] = [];
    const numDays = getDaysInMonth(year, m);
    for (let d = 1; d <= numDays; d++) {
      days.push(new Date(year, m, d));
    }
    months.push(days);
  }
  return months;
}

/** Check if a date is today */
export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

/** Check if a date is in the future */
export function isFuture(dateStr: string): boolean {
  return dateStr > todayStr();
}

/** Check if a date is in the past */
export function isPast(dateStr: string): boolean {
  return dateStr < todayStr();
}

/** Check if habit is scheduled on a given day of week */
export function isScheduledDay(frequency: { type: string; daysOfWeek?: number[] }, dayOfWeek: number): boolean {
  if (frequency.type === 'daily') return true;
  if (frequency.type === 'weekly' || frequency.type === 'custom') {
    return frequency.daysOfWeek?.includes(dayOfWeek) ?? false;
  }
  return true;
}
