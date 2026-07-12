import type { Task } from "@/types";
import { isCompletedStatus } from "./status";
import { dayKey } from "./dateUtils";

/**
 * Lightweight per-day summary used by the Sidebar Today section.
 * Returns counts; intentionally avoids heavy computation.
 */
export type TodaySummary = {
  dueToday: number;
  overdue: number;
  thisWeek: number;
};

function toDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function computeTodaySummary(tasks: Task[], now: Date = new Date()): TodaySummary {
  const today = toDayUTC(now).getTime();
  const weekEnd = today + 6 * 86_400_000; // 7-day window inclusive of today

  let dueToday = 0;
  let overdue = 0;
  let thisWeek = 0;

  for (const t of tasks) {
    if (isCompletedStatus(t.status)) continue;
    if (!t.dueDate) continue;
    const due = toDayUTC(new Date(t.dueDate)).getTime();
    if (due === today) dueToday++;
    if (due < today) overdue++;
    if (due >= today && due <= weekEnd) thisWeek++;
  }
  return { dueToday, overdue, thisWeek };
}
