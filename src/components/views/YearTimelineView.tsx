import React, { useMemo } from 'react';
import type { Habit, HabitTrackerData } from '../../types/habit.ts';
import {
  getDaysInMonth,
  getShortMonthName,
  getDayOfWeekLetter,
  getSundayWeekNumber,
  toDateStr,
  isToday,
  isFuture,
  isScheduledDay,
} from '../../lib/calendar.ts';
import { hexToRgba } from '../../lib/colors.ts';
import { HabitIcon } from '../../lib/icons.tsx';
import { getGroupedHabits } from '../../lib/data.ts';

interface YearTimelineViewProps {
  data: HabitTrackerData;
  onToggleEntry: (habitId: string, dateStr: string) => void;
  onCounterIncrement: (habitId: string, dateStr: string) => void;
  onCounterDecrement: (habitId: string, dateStr: string) => void;
}

export function YearTimelineView({ data, onToggleEntry, onCounterIncrement, onCounterDecrement }: YearTimelineViewProps) {
  const year = data.year;

  const habits = useMemo(
    () => data.habits.filter(h => !h.archived).sort((a, b) => a.sortOrder - b.sortOrder),
    [data.habits]
  );

  const grouped = useMemo(
    () => getGroupedHabits(habits, data.groups ?? []),
    [habits, data.groups]
  );
  const hasGroups = (data.groups ?? []).length > 0;

  // Build all days of the year grouped by month
  const months = useMemo(() => {
    const result: { month: number; days: number[] }[] = [];
    for (let m = 0; m < 12; m++) {
      const numDays = getDaysInMonth(year, m);
      const days: number[] = [];
      for (let d = 1; d <= numDays; d++) days.push(d);
      result.push({ month: m, days });
    }
    return result;
  }, [year]);

  const totalDays = useMemo(
    () => months.reduce((sum, m) => sum + m.days.length, 0),
    [months]
  );

  if (habits.length === 0) {
    return (
      <div className="timeline-view">
        <div className="day-empty">No habits to display. Add a habit to get started.</div>
      </div>
    );
  }

  // Flat list of all days for header rows
  const allDays = useMemo(() => {
    const result: { month: number; day: number; dayOfWeek: number; weekNum: number; dividerClass: string }[] = [];
    for (const { month, days } of months) {
      for (const day of days) {
        const d = new Date(year, month, day);
        // Month boundary takes precedence over week boundary
        const dividerClass = day === 1 && month > 0 ? 'tl-month-divider' : d.getDay() === 0 ? 'tl-week-divider' : '';
        result.push({
          month,
          day,
          dayOfWeek: d.getDay(),
          weekNum: getSundayWeekNumber(d),
          dividerClass,
        });
      }
    }
    return result;
  }, [year, months]);

  return (
    <div className="timeline-view">
      <div className="timeline-view-title">{year} Timeline</div>
      <div className="timeline-scroll-container">
        <div className="timeline-grid" style={{ gridTemplateColumns: `160px repeat(${totalDays}, 18px)` }}>
          {/* Row 0: Month headers */}
          <div className="timeline-corner timeline-header-sticky" style={{ top: 0 }} />
          {months.map(({ month, days }) => (
            <div
              key={month}
              className="timeline-month-header"
              style={{ gridColumn: `span ${days.length}` }}
            >
              {getShortMonthName(month)}
            </div>
          ))}

          {/* Row 1: Day numbers */}
          <div className="timeline-corner timeline-header-sticky" style={{ top: 20 }} />
          {allDays.map((d, i) => (
            <div key={`dn-${i}`} className={`timeline-day-header timeline-header-sticky ${d.dividerClass}`} style={{ top: 20 }}>
              {d.day}
            </div>
          ))}

          {/* Row 2: Day letters (S, M, T, ...) */}
          <div className="timeline-corner timeline-header-sticky" style={{ top: 38 }} />
          {allDays.map((d, i) => (
            <div key={`dl-${i}`} className={`timeline-day-header timeline-header-sticky ${d.dividerClass}`} style={{ top: 38 }}>
              {getDayOfWeekLetter(d.dayOfWeek)}
            </div>
          ))}

          {/* Row 3: Week numbers (only on Sundays) */}
          <div className="timeline-corner timeline-header-sticky" style={{ top: 56 }} />
          {allDays.map((d, i) => (
            <div key={`wn-${i}`} className={`timeline-week-header timeline-header-sticky ${d.dividerClass}`} style={{ top: 56 }}>
              {d.dayOfWeek === 0 ? d.weekNum : ''}
            </div>
          ))}

          {/* Habit rows (grouped) */}
          {hasGroups ? grouped.map(({ group, habits: groupHabits }) => (
            <React.Fragment key={group?.id ?? 'ungrouped'}>
              {/* Group header row: sticky label + fill */}
              <div
                className="timeline-group-header"
                style={{ borderLeft: group ? `3px solid ${group.color}` : undefined }}
              >
                {group ? group.name : 'Ungrouped'}
              </div>
              <div className="timeline-group-header-fill" style={{ gridColumn: `span ${totalDays}` }} />
              {groupHabits.map(habit => (
                <TimelineHabitRow
                  key={habit.id}
                  habit={habit}
                  year={year}
                  months={months}
                  onToggle={onToggleEntry}
                  onIncrement={onCounterIncrement}
                  onDecrement={onCounterDecrement}
                />
              ))}
            </React.Fragment>
          )) : habits.map(habit => (
            <TimelineHabitRow
              key={habit.id}
              habit={habit}
              year={year}
              months={months}
              onToggle={onToggleEntry}
              onIncrement={onCounterIncrement}
              onDecrement={onCounterDecrement}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineHabitRow({
  habit,
  year,
  months,
  onToggle,
  onIncrement,
  onDecrement,
}: {
  habit: Habit;
  year: number;
  months: { month: number; days: number[] }[];
  onToggle: (habitId: string, dateStr: string) => void;
  onIncrement: (habitId: string, dateStr: string) => void;
  onDecrement: (habitId: string, dateStr: string) => void;
}) {
  return (
    <>
      <div className="timeline-habit-label">
        <span className="timeline-habit-icon"><HabitIcon name={habit.icon} size={13} /></span>
        <span className="timeline-habit-name">{habit.name}</span>
      </div>
      {months.map(({ month, days }) =>
        days.map(day => {
          const dateStr = toDateStr(new Date(year, month, day));
          const today = isToday(dateStr);
          const future = isFuture(dateStr);
          const dayOfWeek = new Date(year, month, day).getDay();
          const scheduled = isScheduledDay(habit.frequency, dayOfWeek) && dateStr >= habit.startDate;
          const divider = day === 1 && month > 0 ? 'tl-month-divider' : dayOfWeek === 0 ? 'tl-week-divider' : '';

          if (!scheduled) {
            return <div key={dateStr} className={`timeline-cell cell-not-scheduled ${divider}`} />;
          }
          if (future) {
            return <div key={dateStr} className={`timeline-cell cell-future ${today ? 'cell-today' : ''} ${divider}`} />;
          }

          const entry = habit.entries[dateStr];

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
                key={dateStr}
                className={`timeline-cell ${cellClass} ${today ? 'cell-today' : ''} ${divider}`}
                style={cellStyle}
                onClick={() => onToggle(habit.id, dateStr)}
                title={`${getShortMonthName(month)} ${day}`}
              >
                {content}
              </div>
            );
          } else {
            const val = entry?.value ?? 0;
            const pctFill = habit.counterTarget ? Math.min(val / habit.counterTarget, 1) : (val > 0 ? 1 : 0);
            const cellStyle = val > 0 ? { background: hexToRgba(habit.color, 0.3 + pctFill * 0.5) } : {};

            return (
              <div
                key={dateStr}
                className={`timeline-cell ${val > 0 ? 'cell-done' : 'cell-empty'} ${today ? 'cell-today' : ''} ${divider}`}
                style={cellStyle}
                onClick={() => onIncrement(habit.id, dateStr)}
                onContextMenu={(e) => { e.preventDefault(); onDecrement(habit.id, dateStr); }}
                title={`${getShortMonthName(month)} ${day}: ${val}${habit.counterUnit ? ' ' + habit.counterUnit : ''}`}
              >
                {val > 0 ? val : ''}
              </div>
            );
          }
        })
      )}
    </>
  );
}
