import type { Task } from "@/types";
import { isCompletedStatus } from "./status";
import { dayKey } from "./dateUtils";

function toDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Compute the user's current completion streak in days.
 * Walks back from `now` (today). If today has no completions yet, treat yesterday as the
 * latest streak day so users don't see streak=0 mid-day before completing something.
 */
export function computeCurrentStreak(tasks: Task[], now: Date = new Date()): number {
  const completedDates = new Set<string>();
  for (const t of tasks) {
    if (!isCompletedStatus(t.status)) continue;
    const stamp = t.completedAt ?? t.dueDate ?? t.createdAt;
    if (!stamp) continue;
    completedDates.add(dayKey(stamp));
  }

  let streak = 0;
  const cursor = toDayUTC(now);

  // Walk back day by day. If today's set is empty, still try yesterday:
  // this matches the test expectation "streak is zero when today has no completions and yesterday also has none"
  // No grace day. The user's streak starts and resets strictly at today in UTC.
  for (let guard = 0; guard < 366; guard++) {
    const key = dayKey(cursor.toISOString());
    if (completedDates.has(key)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export type DayStat = { dayKey: string; completions: number };

/**
 * Returns a per-day completion counts series for the last N days, oldest-first.
 * Days with no completions return 0.
 */
export function statsForLastNDays(tasks: Task[], days: number, now: Date = new Date()): DayStat[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (!isCompletedStatus(t.status)) continue;
    const stamp = t.completedAt ?? t.dueDate ?? t.createdAt;
    if (!stamp) continue;
    const k = dayKey(stamp);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const out: DayStat[] = [];
  const cursor = toDayUTC(now);
  cursor.setUTCDate(cursor.getUTCDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const k = dayKey(cursor.toISOString());
    out.push({ dayKey: k, completions: counts.get(k) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}
