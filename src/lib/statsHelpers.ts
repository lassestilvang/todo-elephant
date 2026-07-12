import type { Task } from "@/types";
import { isCompletedStatus } from "./status";

/**
 * Most-productive weekday (0 = Sun ... 6 = Sat), based on completedAt timestamps.
 * Returns null if there are zero completions.
 */
export function mostProductiveWeekday(tasks: Task[]): number | null {
  const counts = new Array(7).fill(0);
  let touched = 0;
  for (const t of tasks) {
    if (!isCompletedStatus(t.status) || !t.completedAt) continue;
    counts[new Date(t.completedAt).getUTCDay()]++;
    touched++;
  }
  if (touched === 0) return null;
  let best = 0;
  for (let i = 1; i < 7; i++) if (counts[i] > counts[best]) best = i;
  return best;
}

const WEEKDAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Map 0-6 weekday index to its name. */
export function weekdayName(idx: number | null): string {
  if (idx == null) return "—";
  return WEEKDAY_NAMES_FULL[idx] ?? "—";
}

/** Compute label distribution: returns [{ labelId, count }]. */
export function labelDistribution(tasks: Task[], labels: { id: number; name: string; color?: string }[]) {
  const counts = new Map<number, number>();
  for (const t of tasks) {
    if (!t.labels) continue;
    for (const id of t.labels) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return labels
    .map((label) => ({ labelId: label.id, name: label.name, color: label.color, count: counts.get(label.id) ?? 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Compute priority distribution. */
export function priorityDistribution(tasks: Task[]) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const t of tasks) {
    if (t.priority === "high") counts.high++;
    else if (t.priority === "medium") counts.medium++;
    else counts.low++;
  }
  return counts;
}

/** Compute per-list counts of active tasks. */
export function listDistribution(tasks: Task[], lists: { id: number; name: string; color?: string }[]) {
  const counts = new Map<number, number>();
  for (const t of tasks) {
    if (t.listId == null) continue;
    counts.set(t.listId, (counts.get(t.listId) ?? 0) + 1);
  }
  return lists
    .map((l) => ({ listId: l.id, name: l.name, color: l.color, count: counts.get(l.id) ?? 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Compute completion percentage over non-archived tasks. */
export function completionRate(tasks: Task[]): number {
  const relevant = tasks.filter((t) => t.status !== "archived");
  if (relevant.length === 0) return 0;
  const completed = relevant.filter((t) => isCompletedStatus(t.status)).length;
  return Math.round((completed / relevant.length) * 100);
}
