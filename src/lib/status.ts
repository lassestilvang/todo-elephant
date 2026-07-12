/**
 * Canonical status enum with backward-compatible normalization.
 * Old code wrote 7 different strings for the same concept: pending/todo/in-progress/in_progress/completed/done/archived.
 * This module collapses them into 4 canonical values and ships helpers used across views, hooks, and APIs.
 */

export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;

export type CanonicalStatus =
  (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

const LEGACY_TO_CANONICAL: Record<string, CanonicalStatus> = {
  todo: TASK_STATUS.TODO,
  pending: TASK_STATUS.TODO,
  "in-progress": TASK_STATUS.IN_PROGRESS,
  in_progress: TASK_STATUS.IN_PROGRESS,
  completed: TASK_STATUS.COMPLETED,
  done: TASK_STATUS.COMPLETED,
  archived: TASK_STATUS.ARCHIVED,
};

/** Normalize any legacy/canonical status string into the canonical form. */
export function normalizeStatus(value: string | null | undefined): CanonicalStatus {
  if (!value) return TASK_STATUS.TODO;
  const key = value.toLowerCase();
  return LEGACY_TO_CANONICAL[key] ?? TASK_STATUS.TODO;
}

/** True if the status (in any legacy form) represents a finished task. */
export function isCompletedStatus(value: string | null | undefined): boolean {
  return normalizeStatus(value) === TASK_STATUS.COMPLETED;
}

/** True if the status represents an in-flight task. */
export function isActiveStatus(value: string | null | undefined): boolean {
  const n = normalizeStatus(value);
  return n === TASK_STATUS.TODO || n === TASK_STATUS.IN_PROGRESS;
}

/** True if the status represents an archived task. */
export function isArchivedStatus(value: string | null | undefined): boolean {
  return normalizeStatus(value) === TASK_STATUS.ARCHIVED;
}

/** Kanban column id used by views. */
export const KANBAN_COLUMNS = [
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.COMPLETED,
  TASK_STATUS.ARCHIVED,
] as const;

/** Returns the kanban column id a task should display in. */
export function getKanbanColumnId(status: string | null | undefined): CanonicalStatus {
  return normalizeStatus(status);
}

export const STATUS_OPTIONS: { value: CanonicalStatus; label: string }[] = [
  { value: TASK_STATUS.TODO, label: "To Do" },
  { value: TASK_STATUS.IN_PROGRESS, label: "In Progress" },
  { value: TASK_STATUS.COMPLETED, label: "Completed" },
  { value: TASK_STATUS.ARCHIVED, label: "Archived" },
];
