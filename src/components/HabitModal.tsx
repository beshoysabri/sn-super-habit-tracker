import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from './shared/Modal.tsx';
import { ColorPicker } from './shared/ColorPicker.tsx';
import { IconPicker } from './shared/IconPicker.tsx';
import { HabitIcon, DEFAULT_ICON } from '../lib/icons.tsx';
import { DEFAULT_HABIT_COLOR } from '../lib/colors.ts';
import { toDateStr, getDayOfWeekLetter } from '../lib/calendar.ts';
import type { Habit, HabitFrequency, HabitGroup } from '../types/habit.ts';

interface HabitModalProps {
  habit?: Habit;
  year: number;
  groups: HabitGroup[];
  onSave: (habit: Habit) => void;
  onClose: () => void;
}

export function HabitModal({ habit, year, groups, onSave, onClose }: HabitModalProps) {
  const isEdit = !!habit;
  const [name, setName] = useState(habit?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [icon, setIcon] = useState(habit?.icon ?? DEFAULT_ICON);
  const [color, setColor] = useState(habit?.color ?? DEFAULT_HABIT_COLOR);
  const [trackingType, setTrackingType] = useState<'boolean' | 'counter'>(habit?.trackingType ?? 'boolean');
  const [counterTarget, setCounterTarget] = useState(habit?.counterTarget ?? 1);
  const [counterUnit, setCounterUnit] = useState(habit?.counterUnit ?? '');
  const [frequencyType, setFrequencyType] = useState<HabitFrequency['type']>(habit?.frequency.type ?? 'daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(habit?.frequency.daysOfWeek ?? [1, 2, 3, 4, 5]);
  const [groupId, setGroupId] = useState<string>(habit?.groupId ?? '');
  const [showIcons, setShowIcons] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;

    const frequency: HabitFrequency = {
      type: frequencyType,
      ...(frequencyType !== 'daily' ? { daysOfWeek } : {}),
    };

    const result: Habit = {
      id: habit?.id ?? uuid(),
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      trackingType,
      ...(trackingType === 'counter' ? { counterTarget, counterUnit: counterUnit.trim() } : {}),
      frequency,
      startDate: habit?.startDate ?? toDateStr(new Date(year, 0, 1)),
      archived: habit?.archived ?? false,
      sortOrder: habit?.sortOrder ?? Date.now(),
      ...(groupId ? { groupId } : {}),
      entries: habit?.entries ?? {},
    };

    onSave(result);
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Modal
      title={isEdit ? 'Edit Habit' : 'Add Habit'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {isEdit ? 'Save Changes' : 'Add Habit'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Name</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Exercise, Read, Meditate"
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={2}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Icon</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="icon-preview-btn"
            onClick={() => setShowIcons(!showIcons)}
          >
            <HabitIcon name={icon} size={22} />
          </button>
          <span style={{ fontSize: 12, color: 'var(--ht-muted)' }}>
            Click to {showIcons ? 'hide' : 'change'}
          </span>
        </div>
        {showIcons && (
          <div style={{ marginTop: 8 }}>
            <IconPicker value={icon} onChange={(i) => { setIcon(i); setShowIcons(false); }} />
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      {groups.length > 0 && (
        <div className="form-group">
          <label className="form-label">Group</label>
          <select
            className="form-select"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">No Group</option>
            {groups.sort((a, b) => a.sortOrder - b.sortOrder).map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Tracking Type</label>
        <select
          className="form-select"
          value={trackingType}
          onChange={(e) => setTrackingType(e.target.value as 'boolean' | 'counter')}
        >
          <option value="boolean">Done / Not Done</option>
          <option value="counter">Counter (0, 1, 2, 3...)</option>
        </select>
      </div>

      {trackingType === 'counter' && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Daily Target</label>
            <input
              className="form-input"
              type="number"
              min={1}
              value={counterTarget}
              onChange={(e) => setCounterTarget(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <input
              className="form-input"
              value={counterUnit}
              onChange={(e) => setCounterUnit(e.target.value)}
              placeholder="e.g. glasses, pages"
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Frequency</label>
        <select
          className="form-select"
          value={frequencyType}
          onChange={(e) => setFrequencyType(e.target.value as HabitFrequency['type'])}
        >
          <option value="daily">Every Day</option>
          <option value="weekly">Specific Days</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {(frequencyType === 'weekly' || frequencyType === 'custom') && (
        <div className="form-group">
          <label className="form-label">Days</label>
          <div className="days-picker">
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <button
                key={day}
                type="button"
                className={`day-btn ${daysOfWeek.includes(day) ? 'active' : ''}`}
                onClick={() => toggleDay(day)}
              >
                {getDayOfWeekLetter(day)}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
