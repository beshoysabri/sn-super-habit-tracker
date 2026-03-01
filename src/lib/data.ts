import type { HabitTrackerData, Habit, HabitGroup } from '../types/habit.ts';

const HEADER_MARKER = '---HABIT-TRACKER-DATA---';

interface ParseResult {
  data: HabitTrackerData;
  isNew: boolean;
}

export function parseNoteText(text: string): ParseResult {
  if (!text.trim()) {
    return { data: createEmpty(new Date().getFullYear()), isNew: true };
  }

  // Find JSON body after header marker
  const markerIndex = text.indexOf(HEADER_MARKER);
  const jsonStr = markerIndex >= 0
    ? text.substring(markerIndex + HEADER_MARKER.length).trim()
    : text.trim();

  try {
    const data = JSON.parse(jsonStr) as HabitTrackerData;
    return { data: migrate(data), isNew: false };
  } catch {
    // If parsing fails, treat as new
    return { data: createEmpty(new Date().getFullYear()), isNew: true };
  }
}

export function serializeToNoteText(data: HabitTrackerData): string {
  data.updatedAt = new Date().toISOString();

  const active = data.habits.filter(h => !h.archived);
  const habitSummary = active
    .slice(0, 5)
    .map(h => `${h.name}: ${calculateCompletionRate(h, data.year)}%`)
    .join(' | ');

  const header = [
    `@type: habit-tracker`,
    `@year: ${data.year}`,
    `@habits: ${active.length}`,
    `@summary: ${habitSummary}`,
    '',
    HEADER_MARKER,
  ].join('\n');

  return header + '\n' + JSON.stringify(data);
}

export function generatePreview(data: HabitTrackerData): string {
  const active = data.habits.filter(h => !h.archived);
  if (active.length === 0) return `Habit Tracker ${data.year} - No habits`;
  const top3 = active.slice(0, 3).map(h =>
    `${h.name}: ${calculateCompletionRate(h, data.year)}%`
  ).join(' | ');
  return `${data.year} - ${top3}`;
}

function calculateCompletionRate(habit: Habit, year: number): number {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const startDate = habit.startDate;

  let scheduled = 0;
  let done = 0;

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (ds > todayStr) break;
    if (ds < startDate) continue;

    const dayOfWeek = d.getDay();
    let isScheduled = true;
    if (habit.frequency.type === 'weekly' || habit.frequency.type === 'custom') {
      isScheduled = habit.frequency.daysOfWeek?.includes(dayOfWeek) ?? false;
    }

    if (isScheduled) {
      scheduled++;
      const entry = habit.entries[ds];
      if (entry) {
        if (habit.trackingType === 'boolean' && entry.status === 'done') {
          done++;
        } else if (habit.trackingType === 'counter' && entry.value !== undefined && entry.value > 0) {
          if (habit.counterTarget && habit.counterTarget > 0) {
            done += Math.min(entry.value / habit.counterTarget, 1);
          } else {
            done++;
          }
        }
      }
    }
  }

  return scheduled === 0 ? 0 : Math.round((done / scheduled) * 100);
}

function migrate(data: HabitTrackerData): HabitTrackerData {
  if (!data.version) data.version = 1;
  // v1 → v2: add groups
  if (data.version === 1) {
    data.groups = data.groups ?? [];
    data.version = 2;
  }
  return data;
}

export function createEmpty(year: number): HabitTrackerData {
  return {
    version: 2,
    year,
    habits: [],
    groups: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getGroupedHabits(
  habits: Habit[],
  groups: HabitGroup[]
): { group: HabitGroup | null; habits: Habit[] }[] {
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const result: { group: HabitGroup | null; habits: Habit[] }[] = [];

  for (const group of sortedGroups) {
    const groupHabits = habits.filter(h => h.groupId === group.id);
    if (groupHabits.length > 0) {
      result.push({ group, habits: groupHabits });
    }
  }

  const ungrouped = habits.filter(h => !h.groupId || !groups.some(g => g.id === h.groupId));
  if (ungrouped.length > 0) {
    result.push({ group: null, habits: ungrouped });
  }

  return result;
}
