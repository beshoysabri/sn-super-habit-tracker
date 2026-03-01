import type { HabitTrackerData } from '../types/habit.ts';
import { getMonthName } from './calendar.ts';
import { getCompletionRate, getCurrentStreak, getBestStreak, getMonthlyCompletionRates } from './stats.ts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportPdf(data: HabitTrackerData): void {
  const habits = data.habits.filter(h => !h.archived);
  const doc = new jsPDF();

  // Title
  doc.setFontSize(22);
  doc.text(`Habit Tracker — ${data.year}`, 14, 22);

  doc.setFontSize(12);
  doc.text(`${habits.length} habits tracked`, 14, 32);

  // Summary table
  const summaryHead = [['Habit', 'Completion', 'Current Streak', 'Best Streak']];
  const summaryBody = habits.map(h => [
    `${h.icon} ${h.name}`,
    `${getCompletionRate(h, data.year)}%`,
    `${getCurrentStreak(h)} days`,
    `${getBestStreak(h, data.year)} days`,
  ]);

  autoTable(doc, {
    startY: 40,
    head: summaryHead,
    body: summaryBody,
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 10 },
  });

  // Monthly breakdown per habit
  for (const h of habits) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`${h.icon} ${h.name}`, 14, 20);

    doc.setFontSize(10);
    doc.text(`Overall: ${getCompletionRate(h, data.year)}% | Streak: ${getCurrentStreak(h)} | Best: ${getBestStreak(h, data.year)}`, 14, 28);

    const monthlyRates = getMonthlyCompletionRates(h, data.year);
    const monthHead = [['Month', 'Completion %']];
    const monthBody = monthlyRates.map((rate, i) => [
      getMonthName(i),
      `${rate}%`,
    ]);

    autoTable(doc, {
      startY: 35,
      head: monthHead,
      body: monthBody,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 10 },
    });
  }

  doc.save(`habits-${data.year}.pdf`);
}
