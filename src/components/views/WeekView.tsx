import { useMemo } from 'react';
import type { Habit, HabitTrackerData } from '../../types/habit.ts';
import {
  getWeekDates,
  getDayOfWeekLetter,
  toDateStr,
  isToday,
  isFuture,
  isScheduledDay,
  getMonthName,
  getSundayWeekNumber,
} from '../../lib/calendar.ts';
import { getCompletionRateForPeriod } from '../../lib/stats.ts';
import { hexToRgba } from '../../lib/colors.ts';
import { HabitIcon } from '../../lib/icons.tsx';

interface WeekViewProps {
  data: HabitTrackerData;
  weekStart: Date;
  onWeekChange: (delta: number) => void;
  onToggleEntry: (habitId: string, dateStr: string) => void;
  onCounterIncrement: (habitId: string, dateStr: string) => void;
  onCounterDecrement: (habitId: string, dateStr: string) => void;
}

export function WeekView({ data, weekStart, onWeekChange, onToggleEntry, onCounterIncrement, onCounterDecrement }: WeekViewProps) {
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const habits = useMemo(
    () => data.habits.filter(h => !h.archived).sort((a, b) => a.sortOrder - b.sortOrder),
    [data.habits]
  );

  const weekStartStr = toDateStr(weekDates[0]);
  const weekEndStr = toDateStr(weekDates[6]);

  const startMonth = weekDates[0].getMonth();
  const endMonth = weekDates[6].getMonth();
  const cw = getSundayWeekNumber(weekDates[0]);
  const title = startMonth === endMonth
    ? `${getMonthName(startMonth)} ${weekDates[0].getDate()}–${weekDates[6].getDate()}`
    : `${getMonthName(startMonth)} ${weekDates[0].getDate()} – ${getMonthName(endMonth)} ${weekDates[6].getDate()}`;

  return (
    <div className="week-view">
      <div className="week-view-header">
        <div className="week-view-title">{title}, {data.year} <span className="week-number-label">CW {cw}</span></div>
        <div className="month-nav">
          <button className="month-nav-btn" onClick={() => onWeekChange(-1)}>←</button>
          <button className="month-nav-btn" onClick={() => onWeekChange(1)}>→</button>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="day-empty">No habits to display. Add a habit to get started.</div>
      ) : (
        <div className="week-grid">
          {/* Header row */}
          <div className="week-grid-header" />
          {weekDates.map((d, i) => {
            const ds = toDateStr(d);
            const today = isToday(ds);
            return (
              <div key={i} className={`week-grid-header ${today ? 'today-col' : ''}`}>
                {getDayOfWeekLetter(d.getDay())}
                <br />
                <span style={{ fontSize: 10, opacity: 0.6 }}>{d.getDate()}</span>
              </div>
            );
          })}
          <div className="week-grid-header" />

          {/* Habit rows */}
          {habits.map(habit => (
            <HabitWeekRow
              key={habit.id}
              habit={habit}
              weekDates={weekDates}
              weekStartStr={weekStartStr}
              weekEndStr={weekEndStr}
              onToggle={onToggleEntry}
              onIncrement={onCounterIncrement}
              onDecrement={onCounterDecrement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HabitWeekRow({
  habit,
  weekDates,
  weekStartStr,
  weekEndStr,
  onToggle,
  onIncrement,
  onDecrement,
}: {
  habit: Habit;
  weekDates: Date[];
  weekStartStr: string;
  weekEndStr: string;
  onToggle: (habitId: string, dateStr: string) => void;
  onIncrement: (habitId: string, dateStr: string) => void;
  onDecrement: (habitId: string, dateStr: string) => void;
}) {
  const pct = useMemo(
    () => getCompletionRateForPeriod(habit, weekStartStr, weekEndStr),
    [habit, weekStartStr, weekEndStr]
  );

  return (
    <>
      <div className="week-habit-label">
        <span className="week-habit-icon"><HabitIcon name={habit.icon} size={14} /></span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{habit.name}</span>
      </div>
      {weekDates.map((d, i) => {
        const ds = toDateStr(d);
        const today = isToday(ds);
        const future = isFuture(ds);
        const dayOfWeek = d.getDay();
        const scheduled = isScheduledDay(habit.frequency, dayOfWeek) && ds >= habit.startDate;

        if (!scheduled) {
          return <div key={i} className="week-cell cell-not-scheduled" />;
        }
        if (future) {
          return <div key={i} className={`week-cell cell-future ${today ? 'cell-today' : ''}`} style={today ? { border: '2px solid var(--ht-accent)' } : undefined} />;
        }

        const entry = habit.entries[ds];

        if (habit.trackingType === 'boolean') {
          let cellClass = 'cell-empty';
          let cellStyle = {};
          let content = '';

          if (entry?.status === 'done') {
            cellClass = 'cell-done';
            cellStyle = { background: hexToRgba(habit.color, 0.8) };
            content = '✚';
          } else if (entry?.status === 'skipped') {
            cellClass = 'cell-skipped';
            content = '→';
          } else if (entry?.status === 'missed') {
            cellClass = 'cell-missed';
            content = '✕';
          }

          return (
            <div
              key={i}
              className={`week-cell ${cellClass}`}
              style={{ ...cellStyle, ...(today ? { border: '2px solid var(--ht-accent)' } : {}) }}
              onClick={() => onToggle(habit.id, ds)}
            >
              {content}
            </div>
          );
        } else {
          const val = entry?.value ?? 0;
          let cellClass = val > 0 ? 'cell-done' : 'cell-empty';
          const pctFill = habit.counterTarget ? Math.min(val / habit.counterTarget, 1) : (val > 0 ? 1 : 0);
          const cellStyle = val > 0 ? { background: hexToRgba(habit.color, 0.3 + pctFill * 0.5) } : {};

          return (
            <div
              key={i}
              className={`week-cell ${cellClass}`}
              style={{ ...cellStyle, ...(today ? { border: '2px solid var(--ht-accent)' } : {}) }}
              onClick={() => onIncrement(habit.id, ds)}
              onContextMenu={(e) => { e.preventDefault(); onDecrement(habit.id, ds); }}
              title={`${val}${habit.counterUnit ? ' ' + habit.counterUnit : ''} (right-click: −1)`}
            >
              {val > 0 ? val : ''}
            </div>
          );
        }
      })}
      <div className="week-pct">{pct}%</div>
    </>
  );
}
