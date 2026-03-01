import { useMemo } from 'react';
import type { Habit, HabitTrackerData } from '../../types/habit.ts';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getShortMonthName,
  toDateStr,
  isToday,
  isFuture,
  isScheduledDay,
  getSundayWeekNumber,
} from '../../lib/calendar.ts';
import { hexToRgba } from '../../lib/colors.ts';
import { HabitIcon } from '../../lib/icons.tsx';

interface YearViewProps {
  data: HabitTrackerData;
  habit: Habit | null;
  onToggleEntry: (habitId: string, dateStr: string) => void;
  onCounterIncrement: (habitId: string, dateStr: string) => void;
  onCounterDecrement: (habitId: string, dateStr: string) => void;
}

export function YearView({ data, habit, onToggleEntry, onCounterIncrement, onCounterDecrement }: YearViewProps) {
  const year = data.year;
  const habits = useMemo(() => {
    if (habit) return [habit];
    return data.habits.filter(h => !h.archived).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data.habits, habit]);

  const title = habit ? habit.name : `${year} Overview`;

  return (
    <div className="year-view">
      <div className="year-view-title">
        {habit && <HabitIcon name={habit.icon} size={18} />}
        {' '}{title}
      </div>
      {habits.length === 0 ? (
        <div className="day-empty">No habits to display. Add a habit to get started.</div>
      ) : (
        <div className="year-months-grid">
          {Array.from({ length: 12 }, (_, m) => (
            <YearMonthBlock
              key={m}
              year={year}
              month={m}
              habits={habits}
              singleHabit={habit}
              onToggleEntry={onToggleEntry}
              onCounterIncrement={onCounterIncrement}
              onCounterDecrement={onCounterDecrement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function YearMonthBlock({
  year,
  month,
  habits,
  singleHabit,
  onToggleEntry,
  onCounterIncrement,
  onCounterDecrement,
}: {
  year: number;
  month: number;
  habits: Habit[];
  singleHabit: Habit | null;
  onToggleEntry: (habitId: string, dateStr: string) => void;
  onCounterIncrement: (habitId: string, dateStr: string) => void;
  onCounterDecrement: (habitId: string, dateStr: string) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const allCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) allCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) allCells.push(d);
  while (allCells.length % 7 !== 0) allCells.push(null);

  const rows: { weekNum: number; cells: (number | null)[] }[] = [];
  for (let r = 0; r < allCells.length; r += 7) {
    const rowCells = allCells.slice(r, r + 7);
    const firstDayInRow = rowCells.find(d => d !== null) ?? 1;
    const weekNum = getSundayWeekNumber(new Date(year, month, firstDayInRow));
    rows.push({ weekNum, cells: rowCells });
  }

  return (
    <div className="year-month-block">
      <div className="year-month-label">{getShortMonthName(month)}</div>
      <div className="year-month-grid" style={{ gridTemplateColumns: 'auto repeat(7, 1fr)' }}>
        {rows.map((row, ri) => {
          const rowElements: JSX.Element[] = [
            <div key={`wn-${ri}`} className="year-week-number">{row.weekNum}</div>
          ];
          row.cells.forEach((day, ci) => {
            if (day === null) {
              rowElements.push(<div key={`e-${ri}-${ci}`} />);
              return;
            }

            const dateStr = toDateStr(new Date(year, month, day));
            const today = isToday(dateStr);
            const future = isFuture(dateStr);
            const dayOfWeek = new Date(year, month, day).getDay();

            if (singleHabit) {
              const h = singleHabit;
              const scheduled = isScheduledDay(h.frequency, dayOfWeek) && dateStr >= h.startDate;

              if (!scheduled) {
                rowElements.push(<div key={day} className={`habit-cell cell-not-scheduled ${today ? 'cell-today' : ''}`} />);
                return;
              }
              if (future) {
                rowElements.push(<div key={day} className={`habit-cell cell-future ${today ? 'cell-today' : ''}`} />);
                return;
              }

              const entry = h.entries[dateStr];
              let cellClass = 'cell-empty';
              let cellStyle = {};
              let cellContent: string | number = '';

              if (h.trackingType === 'boolean') {
                if (entry?.status === 'done') {
                  cellClass = 'cell-done';
                  cellStyle = { background: hexToRgba(h.color, 0.8) };
                  cellContent = '✚';
                } else if (entry?.status === 'skipped') {
                  cellClass = 'cell-skipped';
                  cellContent = '→';
                } else if (entry?.status === 'missed') {
                  cellClass = 'cell-missed';
                  cellContent = '✕';
                }
              } else {
                const val = entry?.value ?? 0;
                if (val > 0) {
                  const pct = h.counterTarget ? Math.min(val / h.counterTarget, 1) : 1;
                  cellClass = 'cell-done';
                  cellStyle = { background: hexToRgba(h.color, 0.3 + pct * 0.5) };
                  cellContent = val;
                }
              }

              rowElements.push(
                <div
                  key={day}
                  className={`habit-cell ${cellClass} ${today ? 'cell-today' : ''}`}
                  style={cellStyle}
                  onClick={() => {
                    if (h.trackingType === 'boolean') {
                      onToggleEntry(h.id, dateStr);
                    } else {
                      onCounterIncrement(h.id, dateStr);
                    }
                  }}
                  onContextMenu={h.trackingType === 'counter' ? (e) => { e.preventDefault(); onCounterDecrement(h.id, dateStr); } : undefined}
                  title={`${day}`}
                >
                  {cellContent}
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

              rowElements.push(
                <div
                  key={day}
                  className={`habit-cell ${cellClass} ${today ? 'cell-today' : ''}`}
                  style={cellStyle}
                  title={`${getShortMonthName(month)} ${day}: ${totalDone}/${totalScheduled}`}
                >
                  {totalDone > 0 && totalScheduled > 0 ? (totalDone === totalScheduled ? '✚' : `${totalDone}`) : ''}
                </div>
              );
            }
          });
          return rowElements;
        })}
      </div>
    </div>
  );
}
