import { useRef } from 'react';
import { HABIT_COLORS } from '../../lib/colors.ts';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPreset = HABIT_COLORS.some(c => c.hex === value);

  return (
    <div className="color-picker">
      {HABIT_COLORS.map(c => (
        <button
          key={c.hex}
          type="button"
          className={`color-swatch ${value === c.hex ? 'selected' : ''}`}
          style={{ background: c.hex }}
          onClick={() => onChange(c.hex)}
          title={c.name}
        />
      ))}
      <button
        type="button"
        className={`color-swatch custom-color ${!isPreset && value ? 'selected' : ''}`}
        onClick={() => inputRef.current?.click()}
        title="Custom color"
        style={!isPreset && value ? { background: value } : undefined}
      >
        {(isPreset || !value) && <span style={{ fontSize: 12, color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>⚙</span>}
      </button>
      <input
        ref={inputRef}
        type="color"
        className="hidden-color-input"
        value={value || '#6366f1'}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
