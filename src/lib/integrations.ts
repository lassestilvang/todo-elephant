/**
 * Ecosystem Integrations for Todo Elephant.
 * Email import, calendar sync, and browser extension support.
 */

import type { Task } from "@/types";

// Email import webhook endpoint
export const EMAIL_IMPORT_ENDPOINT = "/api/integrations/email";

// Calendar sync options
export interface CalendarSyncConfig {
  provider: "google" | "outlook" | "apple";
  accessToken?: string;
  refreshToken?: string;
  syncEnabled: boolean;
  twoWaySync: boolean;
}

// Browser extension message types
export interface ExtensionMessage {
  type: "CREATE_TASK" | "GET_TASKS" | "UPDATE_TASK";
  payload?: Task | Partial<Task>;
  taskId?: number;
}

/**
 * Parse an email into task data.
 * Expects subject as title, body as description, and optional date patterns.
 */
export function parseEmailToTask(emailSubject: string, emailBody: string): Partial<Task> {
  // Extract potential dates from email
  const dateMatches = emailBody.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/gi);

  let dueDate: string | undefined;
  if (dateMatches && dateMatches.length > 0) {
    // Try to parse the first date found
    const parsed = new Date(dateMatches[0]);
    if (!isNaN(parsed.getTime())) {
      dueDate = parsed.toISOString();
    }
  }

  // Extract action verbs to determine priority
  const urgentKeywords = ["urgent", "asap", "immediately", "today", "critical", "important"];
  const isUrgent = urgentKeywords.some(k => emailSubject.toLowerCase().includes(k) || emailBody.toLowerCase().includes(k));

  return {
    title: emailSubject,
    description: emailBody.slice(0, 500), // Limit description length
    priority: isUrgent ? "high" : "medium",
    status: "todo",
    dueDate,
  };
}

/**
 * Generate calendar event payload for sync.
 */
export function taskToCalendarEvent(task: Task): {
  summary: string;
  description: string;
  start: { dateTime: string };
  end: { dateTime: string };
} {
  const start = task.dueDate ? new Date(task.dueDate) : new Date();
  const end = new Date(start.getTime() + 60 * 60000); // Default 1 hour

  return {
    summary: task.title,
    description: task.description || "",
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };
}

/**
 * Convert calendar event to task.
 */
export function calendarEventToTask(event: {
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
}): Partial<Task> {
  return {
    title: event.summary,
    description: event.description || "",
    dueDate: event.start.dateTime || event.start.date || new Date().toISOString(),
    priority: "medium",
    status: "todo",
  };
}

// Email template for task creation
export const TASK_EMAIL_TEMPLATE = `Subject: [Task] {task_title}

Due: {due_date}
Priority: {priority}

{task_description}

---
This email will be converted to a task in Todo Elephant.`;