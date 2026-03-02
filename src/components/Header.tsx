import type { ViewType } from '../types/habit.ts';
import type { HabitTrackerData } from '../types/habit.ts';
import { ExportMenu } from './shared/ExportMenu.tsx';

interface HeaderProps {
  data: HabitTrackerData;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onAddHabit: () => void;
  onToggleSidebar: () => void;
}

const VIEW_LABELS: { key: ViewType; label: string; short: string }[] = [
  { key: 'year', label: 'Year Calendar', short: 'Year' },
  { key: 'timeline', label: 'Year Timeline', short: 'Timeline' },
  { key: 'month', label: 'Month', short: 'Month' },
  { key: 'week', label: 'Week', short: 'Week' },
  { key: 'day', label: 'Day', short: 'Day' },
];

export function Header({ data, view, onViewChange, onAddHabit, onToggleSidebar }: HeaderProps) {
  return (
    <div className="ht-header">
      <div className="ht-header-left">
        <button className="ht-menu-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">☰</button>
        <span className="ht-year-display">{data.year}</span>
        <div className="ht-view-toggle">
          {VIEW_LABELS.map(v => (
            <button
              key={v.key}
              className={`ht-view-btn ${view === v.key ? 'active' : ''}`}
              onClick={() => onViewChange(v.key)}
            >
              <span className="view-label-full">{v.label}</span>
              <span className="view-label-short">{v.short}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="ht-header-right">
        <button className="ht-add-btn" onClick={onAddHabit}>
          + Add Habit
        </button>
        <ExportMenu data={data} />
      </div>
    </div>
  );
}
