import { useMemo } from 'react';
import type { Habit, HabitTrackerData } from '../types/habit.ts';
import { StatsCard } from './shared/StatsCard.tsx';
import { HabitIcon } from '../lib/icons.tsx';
import {
  getCompletionRate,
  getCompletionRateForPeriod,
  getCurrentStreak,
  getBestStreak,
  getMonthlyCompletionRates,
  getTotalDone,
} from '../lib/stats.ts';
import { toDateStr, getShortMonthName } from '../lib/calendar.ts';

interface HabitDetailProps {
  habit: Habit;
  data: HabitTrackerData;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export function HabitDetail({ habit, data, onEdit, onArchive, onDelete, onBack }: HabitDetailProps) {
  const year = data.year;
  const overallRate = useMemo(() => getCompletionRate(habit, year), [habit, year]);
  const currentStreak = useMemo(() => getCurrentStreak(habit), [habit]);
  const bestStreak = useMemo(() => getBestStreak(habit, year), [habit, year]);
  const totalDone = useMemo(() => getTotalDone(habit, year), [habit, year]);
  const monthlyRates = useMemo(() => getMonthlyCompletionRates(habit, year), [habit, year]);

  const today = new Date();
  const last30Start = new Date(today);
  last30Start.setDate(today.getDate() - 30);
  const last7Start = new Date(today);
  last7Start.setDate(today.getDate() - 7);

  const last30Rate = useMemo(
    () => getCompletionRateForPeriod(habit, toDateStr(last30Start), toDateStr(today)),
    [habit, last30Start, today]
  );
  const last7Rate = useMemo(
    () => getCompletionRateForPeriod(habit, toDateStr(last7Start), toDateStr(today)),
    [habit, last7Start, today]
  );

  return (
    <div className="habit-detail">
      <div style={{ marginBottom: 12 }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '4px 12px', fontSize: 12 }}>
          ← Back
        </button>
      </div>
      <div className="habit-detail-header">
        <span className="habit-detail-icon"><HabitIcon name={habit.icon} size={32} /></span>
        <div>
          <div className="habit-detail-name">{habit.name}</div>
          {habit.description && <div className="habit-detail-desc">{habit.description}</div>}
        </div>
      </div>

      <div className="habit-detail-actions">
        <button className="btn-secondary" onClick={onEdit}>Edit</button>
        <button className="btn-secondary" onClick={onArchive}>
          {habit.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button className="btn-danger" onClick={onDelete}>Delete</button>
      </div>

      <div className="habit-detail-stats">
        <StatsCard label="Overall" value={`${overallRate}%`} />
        <StatsCard label="Last 30 Days" value={`${last30Rate}%`} />
        <StatsCard label="Last 7 Days" value={`${last7Rate}%`} />
        <StatsCard label="Total Done" value={totalDone} sub="days" />
        <StatsCard label="Current Streak" value={currentStreak} sub="days" />
        <StatsCard label="Best Streak" value={bestStreak} sub="days" />
      </div>

      <div className="monthly-chart">
        <div className="monthly-chart-title">Monthly Completion</div>
        <div className="monthly-chart-bars">
          {monthlyRates.map((rate, i) => (
            <div key={i} className="monthly-chart-bar-wrap">
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                <div
                  className="monthly-chart-bar"
                  style={{
                    height: `${Math.max(rate, 2)}%`,
                    background: habit.color,
                    opacity: rate > 0 ? 0.8 : 0.15,
                  }}
                />
              </div>
              <span className="monthly-chart-label">{getShortMonthName(i).charAt(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
