import { useMemo } from 'react';
import type { Habit, HabitTrackerData } from '../../types/habit.ts';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthName,
  getDayOfWeekLetter,
  toDateStr,
  isToday,
  isFuture,
  isScheduledDay,
  getSundayWeekNumber,
} from '../../lib/calendar.ts';
import { getCompletionRateForPeriod, getCurrentStreak } from '../../lib/stats.ts';
import { hexToRgba } from '../../lib/colors.ts';

interface MonthViewProps {
  data: HabitTrackerData;
  habit: Habit | null;
  month: number;
  onMonthChange: (month: number) => void;
  onToggleEntry: (habitId: string, dateStr: string) => void;
  onCounterIncrement: (habitId: string, dateStr: string) => void;
  onCounterDecrement: (habitId: string, dateStr: string) => void;
}

export function MonthView({ data, habit, month, onMonthChange, onToggleEntry, onCounterIncrement, onCounterDecrement }: MonthViewProps) {
  const year = data.year;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const habits = useMemo(() => {
    if (habit) return [habit];
    return data.habits.filter(h => !h.archived).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data.habits, habit]);

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  // Stats for the selected habit (or first habit)
  const displayHabit = habits[0] ?? null;
  const monthPct = useMemo(
    () => displayHabit ? getCompletionRateForPeriod(displayHabit, startDate, endDate) : 0,
    [displayHabit, startDate, endDate]
  );
  const streak = useMemo(
    () => displayHabit ? getCurrentStreak(displayHabit) : 0,
    [displayHabit]
  );
  const doneCount = useMemo(() => {
    if (!displayHabit) return 0;
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = toDateStr(new Date(year, month, d));
      const entry = displayHabit.entries[ds];
      if (entry?.status === 'done' || (entry?.value !== undefined && entry.value > 0)) count++;
    }
    return count;
  }, [displayHabit, year, month, daysInMonth]);

  // Build rows of 7 cells (with week number at start)
  const rows = useMemo(() => {
    const result: { weekNum: number; cells: (number | null)[] }[] = [];
    const allCells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) allCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) allCells.push(d);
    // Pad to full weeks
    while (allCells.length % 7 !== 0) allCells.push(null);
    for (let r = 0; r < allCells.length; r += 7) {
      const rowCells = allCells.slice(r, r + 7);
      // Find the first real day in this row to get week number
      const firstDayInRow = rowCells.find(d => d !== null) ?? 1;
      const weekNum = getSundayWeekNumber(new Date(year, month, firstDayInRow));
      result.push({ weekNum, cells: rowCells });
    }
    return result;
  }, [year, month, firstDay, daysInMonth]);

  return (
    <div className="month-view">
      <div className="month-view-header">
        <div>
          <div className="month-view-title">{getMonthName(month)} {year}</div>
          {displayHabit && (
            <div className="month-view-stats">
              <span>✚ <span className="month-stat-value">{doneCount}</span></span>
              <span>Rate: <span className="month-stat-value">{monthPct}%</span></span>
              <span>Streak: <span className="month-stat-value">{streak}</span></span>
            </div>
          )}
        </div>
        <div className="month-nav">
          <button
            className="month-nav-btn"
            onClick={() => onMonthChange(Math.max(0, month - 1))}
            disabled={month === 0}
          >
            ←
          </button>
          <button
            className="month-nav-btn"
            onClick={() => onMonthChange(Math.min(11, month + 1))}
            disabled={month === 11}
          >
            →
          </button>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="day-empty">No habits to display. Add a habit to get started.</div>
      ) : (
        <div className="month-cal-grid" style={{ gridTemplateColumns: 'auto repeat(7, 1fr)' }}>
          {/* Header row: empty corner + 7 day letters */}
          <div className="week-number-label" />
          {[0, 1, 2, 3, 4, 5, 6].map(d => (
            <div key={d} className="month-cal-header">{getDayOfWeekLetter(d)}</div>
          ))}
          {/* Week rows */}
          {rows.map((row, ri) => (
            <>
              <div key={`wn-${ri}`} className="week-number-label">{row.weekNum}</div>
              {row.cells.map((day, ci) => {
                if (day === null) return <div key={`e-${ri}-${ci}`} />;

                const dateStr = toDateStr(new Date(year, month, day));
                const today = isToday(dateStr);
                const future = isFuture(dateStr);
                const dayOfWeek = new Date(year, month, day).getDay();

                if (habits.length === 1) {
                  const h = habits[0];
                  const scheduled = isScheduledDay(h.frequency, dayOfWeek) && dateStr >= h.startDate;
                  if (!scheduled) {
                    return (
                      <div key={day} className={`month-cal-cell cell-not-scheduled ${today ? 'cell-today' : ''}`}>
                        {day}
                      </div>
                    );
                  }
                  if (future) {
                    return <div key={day} className={`month-cal-cell cell-future ${today ? 'cell-today' : ''}`}>{day}</div>;
                  }

                  const entry = h.entries[dateStr];
                  let cellClass = 'cell-empty';
                  let cellStyle = {};

                  if (h.trackingType === 'boolean') {
                    if (entry?.status === 'done') {
                      cellClass = 'cell-done';
                      cellStyle = { background: hexToRgba(h.color, 0.8) };
                    } else if (entry?.status === 'skipped') {
                      cellClass = 'cell-skipped';
                    } else if (entry?.status === 'missed') {
                      cellClass = 'cell-missed';
                    }
                  } else {
                    const val = entry?.value ?? 0;
                    if (val > 0) {
                      const pct = h.counterTarget ? Math.min(val / h.counterTarget, 1) : 1;
                      cellClass = 'cell-done';
                      cellStyle = { background: hexToRgba(h.color, 0.3 + pct * 0.5) };
                    }
                  }

                  return (
                    <div
                      key={day}
                      className={`month-cal-cell ${cellClass} ${today ? 'cell-today' : ''}`}
                      style={cellStyle}
                      onClick={() => {
                        if (h.trackingType === 'boolean') {
                          onToggleEntry(h.id, dateStr);
                        } else {
                          onCounterIncrement(h.id, dateStr);
                        }
                      }}
                      onContextMenu={h.trackingType === 'counter' ? (e) => { e.preventDefault(); onCounterDecrement(h.id, dateStr); } : undefined}
                      title={h.trackingType === 'counter' ? `${entry?.value ?? 0}${h.counterUnit ? ' ' + h.counterUnit : ''}` : undefined}
                    >
                      {day}
                    </div>
                  );
                } else {
                  const totalScheduled = habits.filter(h =>
                    isScheduledDay(h.frequency, dayOfWeek) && dateStr >= h.startDate
                  ).length;
                  const totalDone = habits.filter(h => {
                    const entry = h.entries[dateStr];
                    if (h.trackingType === 'boolean') return entry?.status === 'done';
                    return (entry?.value ?? 0) > 0;
                  }).length;

                  let cellClass = 'cell-empty';
                  let cellStyle = {};

                  if (future) {
                    cellClass = 'cell-future';
                  } else if (totalScheduled === 0) {
                    cellClass = 'cell-not-scheduled';
                  } else if (totalDone === totalScheduled && totalScheduled > 0) {
                    cellClass = 'cell-done';
                    cellStyle = { background: hexToRgba('#6366f1', 0.8) };
                  } else if (totalDone > 0) {
                    const pct = totalDone / totalScheduled;
                    cellStyle = { background: hexToRgba('#6366f1', 0.15 + pct * 0.5) };
                  }

                  return (
                    <div
                      key={day}
                      className={`month-cal-cell ${cellClass} ${today ? 'cell-today' : ''}`}
                      style={cellStyle}
                      title={`${totalDone}/${totalScheduled} habits done`}
                    >
                      {day}
                    </div>
                  );
                }
              })}
            </>
          ))}
        </div>
      )}
    </div>
  );
}
