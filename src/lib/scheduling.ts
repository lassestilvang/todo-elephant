/**
 * Smart scheduling engine for Todo Elephant.
 * Recommends optimal time slots based on:
 *   - Task time estimates (from timeEstimate engine)
 *   - User's historical completion patterns
 *   - Priority and urgency
 *   - Avoiding conflicts with existing tasks
 */

import type { Task, FocusSession } from "@/types";
import { calculateTimeEstimate, TimeEstimate } from "./timeEstimate";
import { isCompletedStatus } from "./status";

export interface TimeSlot {
  start: Date;
  end: Date;
  label?: string;
}

export interface SchedulingSuggestion {
  suggestedSlots: TimeSlot[];
  reasoning: string;
  conflicts: Task[];
}

interface ScheduleConfig {
  workHours: { start: number; end: number }; // 24h format
  focusBlockHours: number[]; // Preferred focus hours
  maxTasksPerDay: number;
  weekendWork: boolean;
}

const DEFAULT_CONFIG: ScheduleConfig = {
  workHours: { start: 8, end: 18 },
  focusBlockHours: [9, 10, 14, 15], // 9-10 AM, 2-3 PM
  maxTasksPerDay: 8,
  weekendWork: false,
};

/**
 * Generate scheduling suggestions for a task.
 */
export function generateSchedulingSuggestion(
  task: Task,
  allTasks: Task[],
  focusSessions: FocusSession[],
  config: Partial<ScheduleConfig> = {}
): SchedulingSuggestion {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const estimate = calculateTimeEstimate(task, focusSessions, allTasks, `task-${task.id}`);

  const conflicts: Task[] = [];
  const suggestedSlots: TimeSlot[] = [];

  if (!estimate) {
    // No data - use priority-based defaults
    return {
      suggestedSlots: getPriorityBasedSlots(task.priority, cfg),
      reasoning: "No historical data. Suggestions based on priority.",
      conflicts,
    };
  }

  // Find conflicts (tasks scheduled at same time with overlapping duration)
  const taskDurationMs = estimate.minutes * 60000;

  for (const t of allTasks) {
    if (t.id === task.id) continue;
    if (isCompletedStatus(t.status)) continue;
    if (!t.dueDate) continue;

    const existingStart = new Date(t.dueDate);
    // Assume 60 min for comparison if no estimate available
    const existingEnd = new Date(existingStart.getTime() + 60 * 60000);

    // Check for overlap with proposed slots
    for (const slot of suggestedSlots) {
      if (slotsOverlap(slot, { start: existingStart, end: existingEnd })) {
        conflicts.push(t);
      }
    }
  }

  // Generate smart slots based on estimate and config
  const smartSlots = getSmartSlots(estimate, task.priority, cfg);
  suggestedSlots.push(...smartSlots);

  return {
    suggestedSlots,
    reasoning: `Estimated ${estimate.minutes} minutes based on ${estimate.basedOnCount} similar task(s). ${estimate.confidence > 0.7 ? "High" : estimate.confidence > 0.4 ? "Medium" : "Low"} confidence.`,
    conflicts,
  };
}

/**
 * Get priority-based default slots when no estimate is available.
 */
function getPriorityBasedSlots(priority: string, _config: ScheduleConfig): TimeSlot[] {
  const now = new Date();
  const slots: TimeSlot[] = [];

  // Set to next hour
  now.setHours(now.getHours() + 1, 0, 0, 0);

  if (priority === "high") {
    slots.push({
      start: new Date(now),
      end: new Date(now.getTime() + 25 * 60000),
      label: "As soon as possible",
    });
  }

  // Add tomorrow morning
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  slots.push({
    start: tomorrow,
    end: new Date(tomorrow.getTime() + 60 * 60000),
    label: "Tomorrow morning",
  });

  // Add afternoon slot
  const afternoon = new Date(now);
  afternoon.setHours(14, 0, 0, 0);
  if (afternoon > now) {
    slots.push({
      start: afternoon,
      end: new Date(afternoon.getTime() + 60 * 60000),
      label: "Afternoon focus",
    });
  }

  return slots;
}

/**
 * Generate smart slots based on time estimate and preferences.
 */
function getSmartSlots(estimate: TimeEstimate, priority: string, config: ScheduleConfig): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const taskMinutes = estimate.minutes;

  // Determine number of slots to generate
  const numSlots = priority === "high" ? 3 : 5;

  // Find available slots within work hours
  for (let i = 0; i < numSlots; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(config.focusBlockHours[0] ?? 9, 0, 0, 0);

    // Skip weekends if configured
    if (!config.weekendWork && (date.getUTCDay() === 0 || date.getUTCDay() === 6)) {
      date.setUTCDate(date.getUTCDate() + (date.getUTCDay() === 0 ? 1 : 2));
    }

    // Find next available focus hour
    let found = false;
    for (const hour of config.focusBlockHours) {
      if (found) break;
      date.setUTCHours(hour, 0, 0, 0);

      // Check if this slot is in the future
      if (date > now) {
        slots.push({
          start: new Date(date),
          end: new Date(date.getTime() + taskMinutes * 60000),
          label: formatSlotLabel(date, taskMinutes),
        });
        found = true;
      }
    }
  }

  return slots;
}

/**
 * Check if two time slots overlap.
 */
function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return a.start < b.end && a.end > b.start;
}

/**
 * Format a human-readable label for a slot.
 */
function formatSlotLabel(date: Date, minutes: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = days[date.getUTCDay()];
  const hours = date.getUTCHours();
  const timeStr = hours === 9 ? "9 AM" : hours === 14 ? "2 PM" : `${hours} AM`;
  return `${day} ${timeStr} (${Math.round(minutes / 60)}h)`;
}

/**
 * Get daily capacity based on available time and historical throughput.
 */
export function getDailyCapacity(
  date: Date,
  tasks: Task[],
  focusSessions: FocusSession[],
  config: Partial<ScheduleConfig> = {}
): { availableMinutes: number; suggestedTaskCount: number } {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const workStart = cfg.workHours.start;
  const workEnd = cfg.workHours.end;
  const workMinutes = (workEnd - workStart) * 60;

  // Count tasks already scheduled for this day
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const dayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d >= dayStart && d < dayEnd && !isCompletedStatus(t.status);
  });

  // Estimate time already allocated
  const allocatedMinutes = dayTasks.reduce((sum, t) => {
    // Use existing estimate or default 60 min
    return sum + 60;
  }, 0);

  const availableMinutes = Math.max(0, workMinutes - allocatedMinutes);
  const suggestedTaskCount = Math.floor(availableMinutes / 45); // 45 min average task

  return { availableMinutes, suggestedTaskCount };
}

/**
 * Suggest optimal task ordering for a day.
 */
export function suggestTaskOrdering(tasks: Task[], focusSessions: FocusSession[]): Task[] {
  // Prioritize: high priority, then urgent, then estimated time (shorter first for momentum)
  return [...tasks].sort((a, b) => {
    // High priority first
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (b.priority === "high" && a.priority !== "high") return 1;

    // Urgent first
    if (a.isUrgent && !b.isUrgent) return -1;
    if (b.isUrgent && !a.isUrgent) return 1;

    // Then by estimated time (shorter for quick wins)
    const estA = calculateTimeEstimate(a, focusSessions, tasks);
    const estB = calculateTimeEstimate(b, focusSessions, tasks);

    const minA = estA?.minutes ?? 60;
    const minB = estB?.minutes ?? 60;

    return minA - minB;
  });
}