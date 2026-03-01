import { useState, useCallback, useMemo, useEffect } from 'react';
import type { HabitTrackerData, Habit, HabitGroup, ViewType } from '../types/habit.ts';
import { todayStr, fromDateStr, toDateStr } from '../lib/calendar.ts';
import { Header } from './Header.tsx';
import { HabitSidebar } from './HabitSidebar.tsx';
import { HabitModal } from './HabitModal.tsx';
import { GroupModal } from './GroupModal.tsx';
import { HabitDetail } from './HabitDetail.tsx';
import { ConfirmDialog } from './shared/ConfirmDialog.tsx';
import { ShortcutsHelp } from './shared/ShortcutsHelp.tsx';
import { YearView } from './views/YearView.tsx';
import { YearTimelineView } from './views/YearTimelineView.tsx';
import { MonthView } from './views/MonthView.tsx';
import { WeekView } from './views/WeekView.tsx';
import { DayView } from './views/DayView.tsx';
import { HabitIcon } from '../lib/icons.tsx';

interface HabitTrackerProps {
  data: HabitTrackerData;
  onChange: (data: HabitTrackerData) => void;
}

export function HabitTracker({ data, onChange }: HabitTrackerProps) {
  const [view, setView] = useState<ViewType>('year');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [showDetail, setShowDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    return start;
  });
  const [dayDate, setDayDate] = useState(todayStr());
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<HabitGroup | undefined>(undefined);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(null);

  const selectedHabit = useMemo(
    () => selectedHabitId ? data.habits.find(h => h.id === selectedHabitId) ?? null : null,
    [data.habits, selectedHabitId]
  );

  const activeHabits = useMemo(
    () => data.habits.filter(h => !h.archived),
    [data.habits]
  );

  // -- Habit CRUD --
  const handleSaveHabit = useCallback((habit: Habit) => {
    const existing = data.habits.findIndex(h => h.id === habit.id);
    let newHabits: Habit[];
    if (existing >= 0) {
      newHabits = [...data.habits];
      newHabits[existing] = habit;
    } else {
      newHabits = [...data.habits, habit];
    }
    onChange({ ...data, habits: newHabits });
    setShowHabitModal(false);
    setEditingHabit(undefined);
  }, [data, onChange]);

  const handleArchiveHabit = useCallback((habitId: string) => {
    const newHabits = data.habits.map(h =>
      h.id === habitId ? { ...h, archived: !h.archived } : h
    );
    onChange({ ...data, habits: newHabits });
    setShowDetail(false);
    setSelectedHabitId(null);
  }, [data, onChange]);

  const handleDeleteHabit = useCallback((habitId: string) => {
    const newHabits = data.habits.filter(h => h.id !== habitId);
    onChange({ ...data, habits: newHabits });
    setConfirmDelete(null);
    setShowDetail(false);
    setSelectedHabitId(null);
  }, [data, onChange]);

  // -- Group CRUD --
  const handleSaveGroup = useCallback((group: HabitGroup) => {
    const groups = data.groups ?? [];
    const existing = groups.findIndex(g => g.id === group.id);
    let newGroups: HabitGroup[];
    if (existing >= 0) {
      newGroups = [...groups];
      newGroups[existing] = group;
    } else {
      newGroups = [...groups, group];
    }
    onChange({ ...data, groups: newGroups });
    setShowGroupModal(false);
    setEditingGroup(undefined);
  }, [data, onChange]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    const newGroups = (data.groups ?? []).filter(g => g.id !== groupId);
    // Ungroup habits that were in this group
    const newHabits = data.habits.map(h =>
      h.groupId === groupId ? { ...h, groupId: undefined } : h
    );
    onChange({ ...data, groups: newGroups, habits: newHabits });
    setConfirmDeleteGroup(null);
    setEditingGroup(undefined);
    setShowGroupModal(false);
  }, [data, onChange]);

  const handleReorderGroups = useCallback((orderedGroupIds: string[]) => {
    const newGroups = (data.groups ?? []).map(g => {
      const idx = orderedGroupIds.indexOf(g.id);
      return idx >= 0 ? { ...g, sortOrder: idx } : g;
    });
    onChange({ ...data, groups: newGroups });
  }, [data, onChange]);

  // -- Entry toggling --
  const toggleEntry = useCallback((habitId: string, dateStr: string) => {
    const newHabits = data.habits.map(h => {
      if (h.id !== habitId) return h;
      const entries = { ...h.entries };
      const current = entries[dateStr];

      if (h.trackingType === 'boolean') {
        // Cycle: empty → done → skipped → empty
        if (!current || !current.status) {
          entries[dateStr] = { status: 'done', timestamp: new Date().toISOString() };
        } else if (current.status === 'done') {
          entries[dateStr] = { ...current, status: 'skipped', timestamp: new Date().toISOString() };
        } else {
          // skipped or missed → clear
          delete entries[dateStr];
        }
      }

      return { ...h, entries };
    });
    onChange({ ...data, habits: newHabits });
  }, [data, onChange]);

  const counterIncrement = useCallback((habitId: string, dateStr: string) => {
    const newHabits = data.habits.map(h => {
      if (h.id !== habitId) return h;
      const entries = { ...h.entries };
      const current = entries[dateStr];
      const val = (current?.value ?? 0) + 1;
      entries[dateStr] = { ...current, value: val, timestamp: new Date().toISOString() };
      return { ...h, entries };
    });
    onChange({ ...data, habits: newHabits });
  }, [data, onChange]);

  const counterDecrement = useCallback((habitId: string, dateStr: string) => {
    const newHabits = data.habits.map(h => {
      if (h.id !== habitId) return h;
      const entries = { ...h.entries };
      const current = entries[dateStr];
      const val = Math.max(0, (current?.value ?? 0) - 1);
      if (val === 0) {
        delete entries[dateStr];
      } else {
        entries[dateStr] = { ...current, value: val, timestamp: new Date().toISOString() };
      }
      return { ...h, entries };
    });
    onChange({ ...data, habits: newHabits });
  }, [data, onChange]);

  // -- Navigation --
  const handleWeekChange = useCallback((delta: number) => {
    setWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta * 7);
      return next;
    });
  }, []);

  const handleSelectHabit = useCallback((id: string | null) => {
    setSelectedHabitId(id);
    setShowDetail(false);
  }, []);

  const handleOpenDetail = useCallback(() => {
    if (selectedHabit) setShowDetail(true);
  }, [selectedHabit]);

  // -- Status bar info --
  const todayDone = useMemo(() => {
    const today = todayStr();
    return activeHabits.filter(h => {
      const entry = h.entries[today];
      if (h.trackingType === 'boolean') return entry?.status === 'done';
      return (entry?.value ?? 0) > 0;
    }).length;
  }, [activeHabits]);

  const todayTotal = useMemo(() => {
    const today = todayStr();
    const d = new Date();
    return activeHabits.filter(h => {
      if (today < h.startDate) return false;
      if (h.frequency.type === 'daily') return true;
      return h.frequency.daysOfWeek?.includes(d.getDay()) ?? false;
    }).length;
  }, [activeHabits]);

  // -- Keyboard shortcuts --
  const viewKeys: ViewType[] = ['year', 'timeline', 'month', 'week', 'day'];
  const sortedActiveHabits = useMemo(
    () => activeHabits.sort((a, b) => a.sortOrder - b.sortOrder),
    [activeHabits]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (showHabitModal || showGroupModal || confirmDelete || confirmDeleteGroup) return;

      switch (e.key) {
        case '1': case '2': case '3': case '4': case '5':
          setView(viewKeys[parseInt(e.key) - 1]);
          break;
        case 'n':
          setEditingHabit(undefined);
          setShowHabitModal(true);
          break;
        case 'ArrowLeft':
          if (view === 'month') setMonth(m => Math.max(0, m - 1));
          else if (view === 'week') handleWeekChange(-1);
          else if (view === 'day') {
            const prev = fromDateStr(dayDate);
            prev.setDate(prev.getDate() - 1);
            setDayDate(toDateStr(prev));
          }
          break;
        case 'ArrowRight':
          if (view === 'month') setMonth(m => Math.min(11, m + 1));
          else if (view === 'week') handleWeekChange(1);
          else if (view === 'day') {
            const next = fromDateStr(dayDate);
            next.setDate(next.getDate() + 1);
            setDayDate(toDateStr(next));
          }
          break;
        case 'ArrowUp': {
          e.preventDefault();
          const idx = sortedActiveHabits.findIndex(h => h.id === selectedHabitId);
          if (idx <= 0) setSelectedHabitId(null);
          else setSelectedHabitId(sortedActiveHabits[idx - 1].id);
          setShowDetail(false);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const idx = selectedHabitId === null ? -1 : sortedActiveHabits.findIndex(h => h.id === selectedHabitId);
          if (idx < sortedActiveHabits.length - 1) {
            setSelectedHabitId(sortedActiveHabits[idx + 1].id);
          }
          setShowDetail(false);
          break;
        }
        case 'Enter':
          if (selectedHabit && !showDetail) setShowDetail(true);
          break;
        case 'Escape':
          if (showShortcuts) setShowShortcuts(false);
          else if (showDetail) setShowDetail(false);
          break;
        case '?':
          setShowShortcuts(s => !s);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, showHabitModal, showGroupModal, confirmDelete, confirmDeleteGroup, showDetail, showShortcuts, selectedHabitId, selectedHabit, sortedActiveHabits, dayDate, handleWeekChange]);

  return (
    <>
      <Header
        data={data}
        view={view}
        onViewChange={setView}
        onAddHabit={() => { setEditingHabit(undefined); setShowHabitModal(true); }}
      />

      <div className="ht-layout">
        <HabitSidebar
          data={data}
          selectedHabitId={selectedHabitId}
          onSelectHabit={handleSelectHabit}
          onAddHabit={() => { setEditingHabit(undefined); setShowHabitModal(true); }}
          onAddGroup={() => { setEditingGroup(undefined); setShowGroupModal(true); }}
          onEditGroup={(group) => { setEditingGroup(group); setShowGroupModal(true); }}
          onReorderGroups={handleReorderGroups}
        />

        <div className="ht-content">
          {showDetail && selectedHabit ? (
            <HabitDetail
              habit={selectedHabit}
              data={data}
              onEdit={() => {
                setEditingHabit(selectedHabit);
                setShowHabitModal(true);
                setShowDetail(false);
              }}
              onArchive={() => handleArchiveHabit(selectedHabit.id)}
              onDelete={() => setConfirmDelete(selectedHabit.id)}
              onBack={() => setShowDetail(false)}
            />
          ) : (
            <>
              {selectedHabit && !showDetail && (
                <div style={{ marginBottom: 12 }}>
                  <button
                    className="btn-secondary"
                    onClick={handleOpenDetail}
                    style={{ padding: '4px 12px', fontSize: 12 }}
                  >
                    <HabitIcon name={selectedHabit.icon} size={14} /> {selectedHabit.name} — View Stats
                  </button>
                </div>
              )}

              {view === 'year' && (
                <YearView
                  data={data}
                  habit={selectedHabit}
                  onToggleEntry={toggleEntry}
                  onCounterIncrement={counterIncrement}
                  onCounterDecrement={counterDecrement}
                />
              )}
              {view === 'timeline' && (
                <YearTimelineView
                  data={data}
                  onToggleEntry={toggleEntry}
                  onCounterIncrement={counterIncrement}
                  onCounterDecrement={counterDecrement}
                />
              )}
              {view === 'month' && (
                <MonthView
                  data={data}
                  habit={selectedHabit}
                  month={month}
                  onMonthChange={setMonth}
                  onToggleEntry={toggleEntry}
                  onCounterIncrement={counterIncrement}
                  onCounterDecrement={counterDecrement}
                />
              )}
              {view === 'week' && (
                <WeekView
                  data={data}
                  weekStart={weekStart}
                  onWeekChange={handleWeekChange}
                  onToggleEntry={toggleEntry}
                  onCounterIncrement={counterIncrement}
                  onCounterDecrement={counterDecrement}
                />
              )}
              {view === 'day' && (
                <DayView
                  data={data}
                  date={dayDate}
                  onDateChange={setDayDate}
                  onToggleEntry={toggleEntry}
                  onCounterIncrement={counterIncrement}
                  onCounterDecrement={counterDecrement}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="ht-statusbar">
        <span>Total: {activeHabits.length} habits</span>
        <span>Today: {todayDone}/{todayTotal} done</span>
        <button
          className="ht-shortcuts-btn"
          onClick={() => setShowShortcuts(s => !s)}
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
      </div>

      {/* Modals */}
      {showHabitModal && (
        <HabitModal
          habit={editingHabit}
          year={data.year}
          groups={data.groups ?? []}
          onSave={handleSaveHabit}
          onClose={() => { setShowHabitModal(false); setEditingHabit(undefined); }}
        />
      )}

      {showGroupModal && (
        <GroupModal
          group={editingGroup}
          onSave={handleSaveGroup}
          onClose={() => { setShowGroupModal(false); setEditingGroup(undefined); }}
        />
      )}

      {showShortcuts && (
        <ShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Habit"
          message="Are you sure you want to permanently delete this habit? All tracking data will be lost."
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteHabit(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDeleteGroup && (
        <ConfirmDialog
          title="Delete Group"
          message="Delete this group? Habits in this group will become ungrouped (not deleted)."
          confirmLabel="Delete Group"
          danger
          onConfirm={() => handleDeleteGroup(confirmDeleteGroup)}
          onCancel={() => setConfirmDeleteGroup(null)}
        />
      )}
    </>
  );
}
