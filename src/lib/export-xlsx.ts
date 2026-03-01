import type { HabitTrackerData } from '../types/habit.ts';
import { toDateStr, getMonthName, getDaysInMonth } from './calendar.ts';
import { getCompletionRate, getCurrentStreak, getBestStreak } from './stats.ts';
import * as XLSX from 'xlsx';

export function exportXlsx(data: HabitTrackerData): void {
  const habits = data.habits.filter(h => !h.archived);
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Habit', 'Type', 'Completion %', 'Current Streak', 'Best Streak'],
    ...habits.map(h => [
      `${h.icon} ${h.name}`,
      h.trackingType,
      getCompletionRate(h, data.year),
      getCurrentStreak(h),
      getBestStreak(h, data.year),
    ]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Daily data sheet
  const header = ['Date', ...habits.map(h => h.name)];
  const rows: (string | number)[][] = [header];

  const start = new Date(data.year, 0, 1);
  const end = new Date(data.year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = toDateStr(d);
    const values = habits.map(h => {
      const entry = h.entries[dateStr];
      if (!entry) return '';
      if (h.trackingType === 'boolean') return entry.status || '';
      return entry.value ?? 0;
    });
    rows.push([dateStr, ...values]);
  }

  const dailySheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Data');

  // Per-month sheets
  for (let m = 0; m < 12; m++) {
    const daysInMonth = getDaysInMonth(data.year, m);
    const monthHeader = ['Day', ...habits.map(h => h.name)];
    const monthRows: (string | number)[][] = [monthHeader];

    for (let d = 1; d <= daysInMonth; d++) {
      const ds = toDateStr(new Date(data.year, m, d));
      const values = habits.map(h => {
        const entry = h.entries[ds];
        if (!entry) return '';
        if (h.trackingType === 'boolean') return entry.status || '';
        return entry.value ?? 0;
      });
      monthRows.push([String(d), ...values]);
    }

    const monthSheet = XLSX.utils.aoa_to_sheet(monthRows);
    XLSX.utils.book_append_sheet(wb, monthSheet, getMonthName(m));
  }

  XLSX.writeFile(wb, `habits-${data.year}.xlsx`);
}
