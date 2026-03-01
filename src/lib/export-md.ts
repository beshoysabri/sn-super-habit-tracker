import type { HabitTrackerData } from '../types/habit.ts';
import { toDateStr, getMonthName, getDaysInMonth } from './calendar.ts';
import { getCompletionRate, getCurrentStreak, getBestStreak } from './stats.ts';

export function exportMarkdown(data: HabitTrackerData): void {
  const habits = data.habits.filter(h => !h.archived);
  const lines: string[] = [];

  lines.push(`# Habit Tracker — ${data.year}`);
  lines.push('');
  lines.push(`**Habits:** ${habits.length}`);
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Habit | Completion | Current Streak | Best Streak |');
  lines.push('|-------|-----------|----------------|-------------|');

  for (const h of habits) {
    const pct = getCompletionRate(h, data.year);
    const current = getCurrentStreak(h);
    const best = getBestStreak(h, data.year);
    lines.push(`| ${h.icon} ${h.name} | ${pct}% | ${current} days | ${best} days |`);
  }

  lines.push('');

  // Monthly detail for each habit
  for (const h of habits) {
    lines.push(`## ${h.icon} ${h.name}`);
    lines.push('');
    if (h.description) {
      lines.push(`> ${h.description}`);
      lines.push('');
    }

    for (let m = 0; m < 12; m++) {
      const daysInMonth = getDaysInMonth(data.year, m);
      lines.push(`### ${getMonthName(m)}`);
      lines.push('');
      lines.push('| Day | Status |');
      lines.push('|-----|--------|');

      for (let d = 1; d <= daysInMonth; d++) {
        const ds = toDateStr(new Date(data.year, m, d));
        const entry = h.entries[ds];
        let status = '—';
        if (entry) {
          if (h.trackingType === 'boolean') {
            status = entry.status === 'done' ? '✓' : entry.status === 'skipped' ? '→' : entry.status === 'missed' ? '✗' : '—';
          } else {
            status = entry.value !== undefined ? `${entry.value}${h.counterUnit ? ' ' + h.counterUnit : ''}` : '—';
          }
        }
        lines.push(`| ${d} | ${status} |`);
      }
      lines.push('');
    }
  }

  const content = lines.join('\n');
  downloadFile(`habits-${data.year}.md`, content, 'text/markdown');
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
