import type { CareLog, CareTask } from '@/lib/types';

const DAY_MS = 86_400_000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type DueStatus = 'overdue' | 'today' | 'soon' | 'scheduled';

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function diffInDays(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / DAY_MS);
}

function toLocalDay(value: string): Date {
  if (DATE_ONLY.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return startOfDay(new Date(value));
}

export function getDueDate(task: CareTask, intervalDays = task.interval_days): Date {
  if (!task.last_done_on) {
    // A task added to an established plant should start from the day its
    // schedule was created, not from the plant's original acquisition date.
    return toLocalDay(task.created_at);
  }
  return addDays(toLocalDay(task.last_done_on), intervalDays);
}

export function getDueStatus(dueDate: Date, today: Date): DueStatus {
  const diff = diffInDays(dueDate, today);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 2) return 'soon';
  return 'scheduled';
}

export function formatDueLabel(dueDate: Date, today: Date): string {
  const diff = diffInDays(dueDate, today);
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < -1) return `${Math.abs(diff)} days overdue`;
  return `In ${diff} days`;
}

export function computeStreak(logs: CareLog[], today: Date): number {
  const days = new Set(logs.map((log) => toISODate(new Date(log.done_at))));
  const cursor = startOfDay(today);
  if (!days.has(toISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(toISODate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function countLogsByDay(logs: CareLog[], days: number, today: Date): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const key = toISODate(new Date(log.done_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index - (days - 1));
    const key = toISODate(date);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}
