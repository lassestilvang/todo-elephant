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

// Webhook security configuration
export interface WebhookSecurityConfig {
  secret: string;
  ipWhitelist: string[];
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  allowedEventTypes: string[];
}

// Webhook verification functions
const crypto = require('crypto');

function createHash(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHash(payload, secret);
  return timingSafeEqual(signature, expected);
}

function validateEventType(type: string): boolean {
  const allowed = ['EVENT', 'UPDATE', 'DELETE', 'TEAM_ACCESS', 'PROJECT_UPDATE'];
  return allowed.includes(type.toUpperCase());
}

function rateLimitWebhookRequests(ip: string): boolean {
  const cache = global.webhookRateCache || (global.webhookRateCache = {});
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const limit = 100;

  if (!cache[ip]) {
    cache[ip] = { count: 1, resetTime: now + windowMs };
  } else {
    const record = cache[ip];
    if (now > record.resetTime) {
      count = 1;
      resetTime = now + windowMs;
    } else {
      count++;
    }
    cache[ip] = { count, resetTime };
  }

  if (cache[ip].count > limit) {
    return false;
  }

  return true;
}