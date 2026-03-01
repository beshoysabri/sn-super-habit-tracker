interface ShortcutsHelpProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { key: '1', action: 'Year Calendar view' },
  { key: '2', action: 'Year Timeline view' },
  { key: '3', action: 'Month view' },
  { key: '4', action: 'Week view' },
  { key: '5', action: 'Day view' },
  { key: 'n', action: 'Add new habit' },
  { key: '← / →', action: 'Navigate prev/next period' },
  { key: '↑ / ↓', action: 'Select prev/next habit' },
  { key: 'Enter', action: 'Open habit detail' },
  { key: 'Escape', action: 'Close detail / modal' },
  { key: '?', action: 'Toggle this help' },
];

export function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-panel" onClick={e => e.stopPropagation()}>
        <div className="shortcuts-title">Keyboard Shortcuts</div>
        <div className="shortcuts-list">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="shortcuts-row">
              <kbd className="shortcuts-key">{s.key}</kbd>
              <span className="shortcuts-action">{s.action}</span>
            </div>
          ))}
        </div>
        <div className="shortcuts-hint">
          Counter habits: right-click to decrement
        </div>
        <button className="btn-secondary" onClick={onClose} style={{ marginTop: 12, width: '100%' }}>
          Close
        </button>
      </div>
    </div>
  );
}
