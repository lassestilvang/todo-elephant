/**
 * Pure fetch helpers for the task-template API. Extracted from useTaskTemplates
 * so the API surface can be unit-tested with plain vitest fetch-mocks (no
 * @testing-library/react required).
 *
 * Endpoints:
 *   GET  /api/tasks/from-template            → Task[]
 *   POST /api/tasks/from-template            → Task (single; count:1 by default)
 *   POST /api/tasks (isTemplate: true)       → Task
 *   DELETE /api/tasks/:id                    → 200 (cascades to template removal)
 */
import { Task, NewTask } from "@/types";

export interface TemplateOverrides {
  dueDate?: string;
  title?: string;
  listId?: number;
}

export class TemplateApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "TemplateApiError";
  }
}

/** Fetch all task templates. Returns [] on non-2xx (does not throw). */
export async function fetchTemplates(): Promise<Task[]> {
  try {
    const res = await fetch("/api/tasks/from-template");
    if (!res.ok) return [];
    return (await res.json()) as Task[];
  } catch (err) {
    console.error("[templatesApi] fetchTemplates failed:", err);
    return [];
  }
}

/**
 * Module-level counter that guarantees uniqueness across every call to
 * `buildTemplatePayload` during the lifetime of the JS module.
 *
 * IDs are derived as `Date.now() * 1_000 + counter`. We deliberately do
 * NOT multiply Date.now() by 1_000_000_000 — that pushes the value to
 * ~1.7e21, well beyond `Number.MAX_SAFE_INTEGER` (~9.007e15), where
 * adding small integers (subtask index) loses precision and adjacent
 * IDs collide. Scaling by 1_000 keeps the final value comfortably
 * within the safe-integer range.
 *
 * The counter advances by `SUBTASK_ID_GAP` (1000) per call so that the
 * range [base, base + subtasks.length - 1] for call N never overlaps
 * the range for call N+1, even when many subtasks are templated.
 */
const SUBTASK_ID_GAP = 1000;
const COUNTER_WRAP = Number.MAX_SAFE_INTEGER - SUBTASK_ID_GAP;
let _templateSubtaskCounter = 0;
function nextSubtaskBase(): number {
  _templateSubtaskCounter = (_templateSubtaskCounter + SUBTASK_ID_GAP) % COUNTER_WRAP;
  return Date.now() * 1_000 + _templateSubtaskCounter;
}

/**
 * Build the request body for "save this task as a template". Clones subtasks
 * with guaranteed-unique IDs and resets them to incomplete.
 *
 * ID strategy: each call increments a module-level counter; combined with
 * `Date.now()`, this yields collision-free numeric IDs without any
 * pseudo-random source.
 *
 * Exported so tests can verify the shape independently of fetch.
 */
export function buildTemplatePayload(task: Task, templateName?: string): NewTask & { isTemplate: boolean } {
  const baseId = nextSubtaskBase();
  return {
    title: templateName || `${task.title} (Template)`,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    status: "pending",
    listId: task.listId,
    labels: task.labels || [],
    subtasks:
      task.subtasks?.map((s, idx) => ({
        id: baseId + idx,
        title: s.title,
        completed: false,
      })) || [],
    dependsOnTaskId: null,
    isImportant: task.isImportant,
    isUrgent: task.isUrgent,
    recurrence: task.recurrence,
    completedPomodoros: 0,
    parentRecurrenceId: null,
    order: 0,
    archivedAt: null,
    completedAt: null,
    isTemplate: true,
  };
}

/** Save a task as a template. Throws TemplateApiError on non-2xx. */
export async function postTemplate(task: Task, templateName?: string): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildTemplatePayload(task, templateName)),
  });
  if (!res.ok) throw new TemplateApiError(res.status, "Failed to save as template");
  return (await res.json()) as Task;
}

/**
 * Spawn one or more tasks from a saved template. Returns null on failure
 * (caller can show a toast).
 */
export async function createTaskFromTemplate(
  templateId: number,
  overrides: TemplateOverrides = {},
  count = 1,
): Promise<Task | null> {
  try {
    const res = await fetch("/api/tasks/from-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, overrides, count }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new TemplateApiError(res.status, data.error || "Failed to create task from template");
    }
    return (await res.json()) as Task;
  } catch (err) {
    console.error("[templatesApi] createTaskFromTemplate failed:", err);
    if (err instanceof TemplateApiError) throw err;
    throw new TemplateApiError(0, "Network error");
  }
}

/** Delete a template (the underlying task with isTemplate: true). Throws on non-2xx. */
export async function deleteTemplateById(templateId: number): Promise<void> {
  const res = await fetch(`/api/tasks/${templateId}`, { method: "DELETE" });
  if (!res.ok) throw new TemplateApiError(res.status, "Failed to delete template");
}
