import type { ViewType } from '../types/habit.ts';
import type { HabitTrackerData } from '../types/habit.ts';
import { ExportMenu } from './shared/ExportMenu.tsx';

interface HeaderProps {
  data: HabitTrackerData;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onAddHabit: () => void;
}

const VIEW_LABELS: { key: ViewType; label: string }[] = [
  { key: 'year', label: 'Year Calendar' },
  { key: 'timeline', label: 'Year Timeline' },
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
];

export function Header({ data, view, onViewChange, onAddHabit }: HeaderProps) {
  return (
    <div className="ht-header">
      <div className="ht-header-left">
        <span className="ht-year-display">{data.year}</span>
        <div className="ht-view-toggle">
          {VIEW_LABELS.map(v => (
            <button
              key={v.key}
              className={`ht-view-btn ${view === v.key ? 'active' : ''}`}
              onClick={() => onViewChange(v.key)}
            >
              {v.label}
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
