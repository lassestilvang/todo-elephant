/**
 * Task Archaeology - Track and analyze task evolution over time.
 * Records changes to title, description, status, and other fields.
 */

import type { Task } from "@/types";

export interface TaskHistoryEntry {
  id: string;
  taskId: number;
  field: "title" | "description" | "status" | "priority" | "dueDate" | "labels";
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changedBy: string;
}

/**
 * Extract task history from activity logs.
 * Shows how tasks have evolved over time.
 */
export function extractTaskHistory(tasks: Task[]): Map<number, TaskHistoryEntry[]> {
  const history = new Map<number, TaskHistoryEntry[]>();

  // In a real implementation, this would query actual history from a database
  // For now, we'll derive it from current task state with creation date

  tasks.forEach(task => {
    const entries: TaskHistoryEntry[] = [];

    // Record the creation as an entry
    entries.push({
      id: `creation-${task.id}`,
      taskId: task.id,
      field: "status",
      oldValue: null,
      newValue: "created",
      changedAt: task.createdAt,
      changedBy: "system",
    });

    // If there's an update, record transitions
    if (task.updatedAt !== task.createdAt) {
      entries.push({
        id: `update-${task.id}`,
        taskId: task.id,
        field: "status",
        oldValue: "created",
        newValue: task.status,
        changedAt: task.updatedAt,
        changedBy: "user",
      });
    }

    // Record completion if applicable
    if (task.completedAt && (task.status === "completed" || task.status === "done")) {
      entries.push({
        id: `completion-${task.id}`,
        taskId: task.id,
        field: "status",
        oldValue: "in-progress",
        newValue: "completed",
        changedAt: task.completedAt,
        changedBy: "user",
      });
    }

    history.set(task.id, entries);
  });

  return history;
}

/**
 * Analyze title changes for a task.
 * Returns the evolution path.
 */
export function analyzeTitleEvolution(taskId: number, history: Map<number, TaskHistoryEntry[]>): {
  original: string | null;
  current: string;
  changes: { from: string; to: string; at: string }[];
} | null {
  const entries = history.get(taskId);
  if (!entries) return null;

  const titleChanges = entries.filter(e => e.field === "title");
  const currentTask = titleChanges.length > 0
    ? titleChanges[titleChanges.length - 1].newValue
    : entries.find(e => e.field === "status" && e.newValue === "created") ? "created" : null;

  return {
    original: titleChanges.length > 0 ? titleChanges[0].oldValue : null,
    current: currentTask ?? "",
    changes: titleChanges.map(c => ({
      from: c.oldValue ?? "",
      to: c.newValue ?? "",
      at: c.changedAt,
    })),
  };
}

/**
 * Get tasks with significant evolution (many changes or renamed).
 */
export function getTasksWithSignificantHistory(
  tasks: Task[],
  history: Map<number, TaskHistoryEntry[]>,
  threshold: number = 3
): number[] {
  return tasks
    .filter(task => {
      const entries = history.get(task.id);
      return (entries?.length ?? 0) >= threshold;
    })
    .map(task => task.id);
}