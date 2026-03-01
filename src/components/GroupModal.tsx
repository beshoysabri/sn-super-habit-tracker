import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from './shared/Modal.tsx';
import { ColorPicker } from './shared/ColorPicker.tsx';
import { DEFAULT_HABIT_COLOR } from '../lib/colors.ts';
import type { HabitGroup } from '../types/habit.ts';

interface GroupModalProps {
  group?: HabitGroup;
  onSave: (group: HabitGroup) => void;
  onClose: () => void;
}

export function GroupModal({ group, onSave, onClose }: GroupModalProps) {
  const isEdit = !!group;
  const [name, setName] = useState(group?.name ?? '');
  const [color, setColor] = useState(group?.color ?? DEFAULT_HABIT_COLOR);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: group?.id ?? uuid(),
      name: name.trim(),
      color,
      sortOrder: group?.sortOrder ?? Date.now(),
    });
  };

  return (
    <Modal
      title={isEdit ? 'Edit Group' : 'New Group'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Name</label>
        <input
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Health, Work, Personal"
          autoFocus
        />
      </div>
      <div className="form-group">
        <label className="form-label">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
    </Modal>
  );
}
