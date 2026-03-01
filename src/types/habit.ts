// ======= TOP-LEVEL NOTE STRUCTURE =======

export interface HabitTrackerData {
  version: number;
  year: number;
  habits: Habit[];
  groups: HabitGroup[];
  createdAt: string;
  updatedAt: string;
}

// ======= HABIT GROUPS =======

export interface HabitGroup {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

// ======= HABIT DEFINITION =======

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  trackingType: 'boolean' | 'counter';
  counterTarget?: number;
  counterUnit?: string;
  frequency: HabitFrequency;
  startDate: string;
  archived: boolean;
  sortOrder: number;
  groupId?: string;
  entries: Record<string, HabitEntry>;
}

// ======= FREQUENCY =======

export interface HabitFrequency {
  type: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}

// ======= DAILY ENTRY =======

export interface HabitEntry {
  status?: 'done' | 'missed' | 'skipped';
  value?: number;
  note?: string;
  timestamp?: string;
}

// ======= VIEW TYPES =======

export type ViewType = 'year' | 'timeline' | 'month' | 'week' | 'day';
