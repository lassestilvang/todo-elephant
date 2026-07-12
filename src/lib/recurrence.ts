import type { Task } from "@/types";
import { TASK_STATUS, normalizeStatus } from "./status";

export type RecurrenceKind = "none" | "daily" | "weekly" | "monthly";

const VALID: ReadonlySet<RecurrenceKind> = new Set(["none", "daily", "weekly", "monthly"]);

export function isRecurrenceKind(v: unknown): v is RecurrenceKind {
  return typeof v === "string" && VALID.has(v as RecurrenceKind);
}

/**
 * Compute the next due-date ISO string for a completing recurring task.
 * Returns null when recurrence is "none" — caller should not spawn a follow-up.
 *
 * Anchors next-date to max(base, now) so a task whose dueDate is far in the past
 * still produces a forward-dated next occurrence.
 */
export function computeNextDueDate(
  current: Pick<Task, "dueDate" | "recurrence">,
  now: Date = new Date(),
): string | null {
  const kind = (current.recurrence ?? "none") as RecurrenceKind;
  if (kind === "none") return null;

  const base = current.dueDate ? new Date(current.dueDate) : new Date(now);
  const anchor = base.getTime() < now.getTime() ? new Date(now) : base;
  const next = new Date(anchor);

  if (kind === "daily") next.setUTCDate(anchor.getUTCDate() + 1);
  else if (kind === "weekly") next.setUTCDate(anchor.getUTCDate() + 7);
  else if (kind === "monthly") {
    const nextMonth = anchor.getUTCMonth() + 1;
    next.setUTCMonth(nextMonth === 12 ? 0 : nextMonth);
    if (next.getUTCMonth() !== (nextMonth === 12 ? 0 : nextMonth)) {
      next.setUTCDate(0); // Clamp to last of target month
    }
  }

  return next.toISOString();
}

/**
 * Build a fresh next-occurrence task from a completed task.
 * Returns null when recurrence should not spawn a follow-up.
 */
export function buildNextOccurrence(
  source: Task,
  now: Date = new Date(),
): Task | null {
  const nextDue = computeNextDueDate(source, now);
  if (!nextDue) return null;

  return {
    ...source,
    id: 0, // Caller fills in
    status: TASK_STATUS.TODO,
    subtasks: source.subtasks?.map((s, i) => ({ ...s, id: 0, completed: false, _seed: i })) ?? [],
    completedAt: null,
    dueDate: nextDue,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/** True if status transition should trigger recurrence spawn. */
export function shouldSpawnOnComplete(
  source: Task,
  updates: Partial<Task>,
): boolean {
  const becomes = normalizeStatus(updates.status ?? (source.status as string));
  if (becomes !== TASK_STATUS.COMPLETED) return false;
  if ((source.recurrence ?? "none") === "none") return false;
  return normalizeStatus(source.status as string) !== TASK_STATUS.COMPLETED;
}

/**
 * Build a stable ID space for cloned subtasks: combines monotonic counter with Date.now + index
 * to virtually eliminate collisions under load.
 */
export function nextSubtaskIds(count: number, baseMs = Date.now()): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(baseMs * 1000 + i);
  return out;
}
