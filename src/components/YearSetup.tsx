import { useState } from 'react';

interface YearSetupProps {
  onConfirm: (year: number) => void;
}

export function YearSetup({ onConfirm }: YearSetupProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  return (
    <div className="year-setup">
      <div className="year-setup-card">
        <div className="year-setup-icon">📅</div>
        <h1 className="year-setup-title">Super Habit Tracker</h1>
        <p className="year-setup-desc">
          Track your habits across an entire year. Pick a year to get started.
        </p>
        <div className="year-setup-picker">
          <button
            className="year-nav-btn"
            onClick={() => setYear(y => y - 1)}
            aria-label="Previous year"
          >
            ←
          </button>
          <span className="year-display">{year}</span>
          <button
            className="year-nav-btn"
            onClick={() => setYear(y => y + 1)}
            aria-label="Next year"
          >
            →
          </button>
        </div>
        <button
          className="year-confirm-btn"
          onClick={() => onConfirm(year)}
        >
          Start Tracking
        </button>
      </div>
    </div>
  );
}
