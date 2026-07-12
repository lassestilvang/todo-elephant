// types/index.ts — Canonical model definitions.
//
// NOTE on status typing:
// We deliberately keep `status: string` (not the strict CanonicalStatus union) so legacy
// literals ("pending", "in-progress", "done") continue to compile everywhere without
// having to touch every consumer. The API boundary and `migrateLegacy()` always
// normalize via `normalizeStatus()` from `@/src/lib/status` before persisting.

export type Subtask = {
  id: number;
  title: string;
  completed: boolean;
};

export type RecurrenceKind = "none" | "daily" | "weekly" | "monthly";

export type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: string;
  subtasks?: Subtask[];
  listId?: number;
  labels?: number[];
  dependsOnTaskId?: number | null;
  isImportant?: boolean;
  isUrgent?: boolean;
  recurrence?: RecurrenceKind;
  completedPomodoros?: number;
  parentRecurrenceId?: number | null;
  order?: number;
  archivedAt?: string | null;
  /** When true, this task is a reusable template and should be hidden from the active task list. */
  isTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type NewTask = Omit<Task, "id" | "createdAt" | "updatedAt">;

export type List = {
  id: number;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
};

export type Label = {
  id: number;
  name: string;
  color?: string;
};

export type ActivityLog = {
  id: number;
  action: string;
  entityType: "task" | "list" | "label" | "system" | "user";
  entityId: number;
  details?: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export type SavedFilter = {
  id: number;
  name: string;
  query: string;
  statusFilter: "all" | "active" | "completed" | "archived";
  priorityFilter: "all" | "high" | "medium" | "low";
  sortBy: "newest" | "dueDate" | "priority";
};

export type ShortcutConfig = {
  id: string;
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: string;
};

/** Pomodoro / focus session log entry. */
export type FocusSession = {
  id: number;
  taskId: number;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds: number;
  completedEarly: boolean;
};
