/**
 * Power User Features for Todo Elephant.
 * Task macros, custom fields, advanced search DSL, and bulk NLP operations.
 */

import type { Task, SavedFilter } from "@/types";

// Task Macros - record and replay task sequences
export interface TaskMacro {
  id: string;
  name: string;
  description: string;
  actions: MacroAction[];
  createdAt: string;
}

export interface MacroAction {
  type: "create" | "update" | "complete" | "add-label";
  taskTitle: string;
  field?: keyof Task;
  value?: unknown;
}

// Custom Fields - user-defined task properties
export interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  options?: string[]; // For select type
}

/**
 * Execute a task macro - apply recorded actions to current tasks.
 */
export async function executeMacro(macro: TaskMacro, tasks: Task[]): Promise<Task[]> {
  const updatedTasks: Task[] = [];

  for (const action of macro.actions) {
    const task = tasks.find(t => t.title.includes(action.taskTitle));

    if (task && action.type === "update" && action.field && action.value !== undefined) {
      // In production, would call API to update task
      updatedTasks.push({
        ...task,
        [action.field]: action.value,
      } as Task);
    }
  }

  return updatedTasks;
}

/**
 * Advanced Search DSL parser.
 * Example queries: "priority:high AND (label:#work OR label:#urgent) AND due:<today+2d"
 */
export function parseAdvancedSearch(query: string): {
  status?: string;
  priority?: string;
  listId?: number;
  labelId?: number;
  search?: string;
  dueBefore?: Date;
  dueAfter?: Date;
} {
  const result: {
    status?: string;
    priority?: string;
    listId?: number;
    labelId?: number;
    search?: string;
    dueBefore?: Date;
    dueAfter?: Date;
  } = {};

  // Parse priority filter
  const priorityMatch = query.match(/priority:(\w+)/);
  if (priorityMatch) {
    result.priority = priorityMatch[1];
  }

  // Parse status filter
  const statusMatch = query.match(/status:(\w+)/);
  if (statusMatch) {
    result.status = statusMatch[1];
  }

  // Parse label filter
  const labelMatch = query.match(/label:#(\w+)/);
  if (labelMatch) {
    // In production, would resolve label name to ID
    result.labelId = parseInt(labelMatch[1], 10) || undefined;
  }

  // Parse due date range
  const dueBeforeMatch = query.match(/due:<(\w+)/);
  if (dueBeforeMatch) {
    const when = dueBeforeMatch[1];
    if (when === "today") result.dueBefore = new Date();
    else if (when.startsWith("today+")) {
      const days = parseInt(when.split("+")[1], 10);
      const date = new Date();
      date.setDate(date.getDate() + days);
      result.dueBefore = date;
    }
  }

  // Extract free-text search
  const cleanQuery = query
    .replace(/priority:\w+/g, "")
    .replace(/status:\w+/g, "")
    .replace(/label:#\w+/g, "")
    .replace(/due:<\w+/g, "")
    .replace(/AND/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "")
    .trim();

  if (cleanQuery) {
    result.search = cleanQuery;
  }

  return result;
}

/**
 * Apply NLP operations to multiple tasks (bulk processing).
 */
export function applyBulkNLP(tasks: Task[], nlpPattern: string): { taskId: number; updates: Partial<Task> }[] {
  const results: { taskId: number; updates: Partial<Task> }[] = [];

  for (const task of tasks) {
    const updates: Partial<Task> = {};

    // Priority markers
    if (nlpPattern.includes("!high priority")) {
      updates.priority = "high";
    } else if (nlpPattern.includes("!medium priority")) {
      updates.priority = "medium";
    } else if (nlpPattern.includes("!low priority")) {
      updates.priority = "low";
    }

    // Recurrence markers
    if (nlpPattern.includes("~daily")) {
      updates.recurrence = "daily";
    } else if (nlpPattern.includes("~weekly")) {
      updates.recurrence = "weekly";
    } else if (nlpPattern.includes("~monthly")) {
      updates.recurrence = "monthly";
    }

    // Label markers
    const labelMatch = nlpPattern.match(/#(\w+)/);
    if (labelMatch) {
      // In production, would resolve to label ID
    }

    if (Object.keys(updates).length > 0) {
      results.push({ taskId: task.id, updates });
    }
  }

  return results;
}

/**
 * Save search query as a saved filter.
 */
export function saveSearchAsFilter(
  name: string,
  query: string,
  additionalFilters: Partial<Omit<SavedFilter, "id" | "name">> = {}
): SavedFilter {
  const parsed = parseAdvancedSearch(query);

  return {
    id: Date.now(),
    name,
    query,
    statusFilter: parsed.status as any || "all",
    priorityFilter: parsed.priority as any || "all",
    sortBy: "newest",
    ...additionalFilters,
  } as SavedFilter;
}