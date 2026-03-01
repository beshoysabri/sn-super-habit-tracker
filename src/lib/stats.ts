import type { Habit } from '../types/habit.ts';
import { toDateStr, isScheduledDay } from './calendar.ts';

export function getCompletionRate(habit: Habit, year: number): number {
  const today = new Date();
  const todayStr = toDateStr(today);

  let scheduled = 0;
  let done = 0;

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = toDateStr(d);
    if (ds > todayStr) break;
    if (ds < habit.startDate) continue;

    if (isScheduledDay(habit.frequency, d.getDay())) {
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

export function getCompletionRateForPeriod(
  habit: Habit,
  startDate: string,
  endDate: string,
): number {
  let scheduled = 0;
  let done = 0;

  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = toDateStr(d);
    if (ds < habit.startDate) continue;

    if (isScheduledDay(habit.frequency, d.getDay())) {
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

export function getCurrentStreak(habit: Habit): number {
  const today = new Date();
  let streak = 0;
  const d = new Date(today);

  // Check today first; if not done, start from yesterday
  const todayDs = toDateStr(d);
  const todayEntry = habit.entries[todayDs];
  const todayScheduled = isScheduledDay(habit.frequency, d.getDay());

  if (todayScheduled) {
    const isDone = habit.trackingType === 'boolean'
      ? todayEntry?.status === 'done'
      : (todayEntry?.value ?? 0) > 0;
    if (isDone) {
      streak = 1;
    } else {
      // Today not done yet — start counting from yesterday
      d.setDate(d.getDate() - 1);
    }
  } else {
    d.setDate(d.getDate() - 1);
  }

  if (streak === 0) {
    // Start fresh from d (yesterday or earlier)
  }

  // Walk backwards
  for (let i = 0; i < 366; i++) {
    const ds = toDateStr(d);
    if (ds < habit.startDate) break;

    if (isScheduledDay(habit.frequency, d.getDay())) {
      const entry = habit.entries[ds];
      const isDone = habit.trackingType === 'boolean'
        ? entry?.status === 'done'
        : (entry?.value ?? 0) > 0;

      if (isDone) {
        streak++;
      } else {
        break;
      }
    }

    d.setDate(d.getDate() - 1);
  }

  return streak;
}

export function getBestStreak(habit: Habit, year: number): number {
  let bestStreak = 0;
  let currentStreak = 0;

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const today = toDateStr(new Date());

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = toDateStr(d);
    if (ds > today) break;
    if (ds < habit.startDate) continue;

    if (isScheduledDay(habit.frequency, d.getDay())) {
      const entry = habit.entries[ds];
      const isDone = habit.trackingType === 'boolean'
        ? entry?.status === 'done'
        : (entry?.value ?? 0) > 0;

      if (isDone) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
  }

  return bestStreak;
}

export function getMonthlyCompletionRates(habit: Habit, year: number): number[] {
  const rates: number[] = [];
  const today = toDateStr(new Date());

  for (let m = 0; m < 12; m++) {
    let scheduled = 0;
    let done = 0;
    const daysInMonth = new Date(year, m + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, m, day);
      const ds = toDateStr(d);
      if (ds > today) break;
      if (ds < habit.startDate) continue;

      if (isScheduledDay(habit.frequency, d.getDay())) {
        scheduled++;
        const entry = habit.entries[ds];
        if (entry) {
          if (habit.trackingType === 'boolean' && entry.status === 'done') {
            done++;
          } else if (habit.trackingType === 'counter' && (entry.value ?? 0) > 0) {
            if (habit.counterTarget && habit.counterTarget > 0) {
              done += Math.min(entry.value! / habit.counterTarget, 1);
            } else {
              done++;
            }
          }
        }
      }
    }

    rates.push(scheduled === 0 ? 0 : Math.round((done / scheduled) * 100));
  }

  return rates;
}

export function getTotalDone(habit: Habit, year: number): number {
  let done = 0;
  const today = toDateStr(new Date());

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = toDateStr(d);
    if (ds > today) break;
    if (ds < habit.startDate) continue;

    const entry = habit.entries[ds];
    if (entry) {
      if (habit.trackingType === 'boolean' && entry.status === 'done') {
        done++;
      } else if (habit.trackingType === 'counter' && (entry.value ?? 0) > 0) {
        done++;
      }
    }
  }

  return done;
}
