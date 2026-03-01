import type { HabitTrackerData } from '../types/habit.ts';
import { toDateStr } from './calendar.ts';

export function exportCSV(data: HabitTrackerData): void {
  const habits = data.habits.filter(h => !h.archived);
  const header = ['Date', ...habits.map(h => h.name)].join(',');

  const rows: string[] = [header];
  const start = new Date(data.year, 0, 1);
  const end = new Date(data.year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = toDateStr(d);
    const values = habits.map(h => {
      const entry = h.entries[dateStr];
      if (!entry) return '';
      if (h.trackingType === 'boolean') return entry.status || '';
      return entry.value?.toString() || '0';
    });
    rows.push([dateStr, ...values].join(','));
  }

  downloadFile(`habits-${data.year}.csv`, rows.join('\n'), 'text/csv');
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
