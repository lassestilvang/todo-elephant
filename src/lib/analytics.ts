/**
 * Advanced analytics engine for Todo Elephant.
 * Provides cognitive load analysis, productivity insights, time investment tracking, and user behavior analytics.
 */

import type { Task, FocusSession } from "@/types";
import { isCompletedStatus } from "./status";
import { dayKey } from "./dateUtils";

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
}

export interface UserBehavior {
  event: string;
  count: number;
  lastOccurred: number;
}

export interface CognitiveLoad {
  score: number; // 0-100
  level: "low" | "medium" | "high";
  factors: string[];
}

export interface ProductivityDNA {
  peakHours: { hour: number; completionRate: number }[];
  averageTaskTime: number;
  preferredWorkPatterns: string[];
  workStyle: "deep-focus" | "multitasking" | "spread-out";
}

export interface TimeInvestment {
  totalTimeMinutes: number;
  byPriority: Record<string, number>;
  byLabel: Record<string, number>;
  byHour: Record<string, number>;
}

export interface DecisionFatigue {
  score: number; // 0-100
  warning: boolean;
  recommendation: string;
}

/**
 * Analytics Service for tracking user behavior and performance
 */
class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private behavior: Map<string, UserBehavior> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = typeof window !== 'undefined'
      ? localStorage.getItem('analytics-consent') !== 'false'
      : process.env.NODE_ENV === 'development';
  }

  // Track an event
  track(event: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      name: event,
      properties,
      timestamp: Date.now(),
      userId: this.getUserId(),
    };

    this.events.push(analyticsEvent);
    this.persistEvents();

    // Track behavior patterns
    const behaviorKey = event.split('.')[0];
    const existing = this.behavior.get(behaviorKey);
    if (existing) {
      existing.count++;
      existing.lastOccurred = Date.now();
    } else {
      this.behavior.set(behaviorKey, {
        event,
        count: 1,
        lastOccurred: Date.now(),
      });
    }
  }

  // Record a performance metric
  recordMetric(name: string, value: number, unit: PerformanceMetric['unit']): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
  }

  // Track task completion
  trackTaskCompletion(task: Task): void {
    this.track('task.completed', {
      taskId: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
      hasSubtasks: task.subtasks?.length ?? 0,
    });

    this.recordMetric('task_completion_time', this.calculateCompletionTime(task), 'ms');
  }

  // Track task creation
  trackTaskCreation(task: Partial<Task>): void {
    this.track('task.created', {
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
      hasDescription: !!task.description,
    });
  }

  // Track view changes
  trackViewChange(fromView: string, toView: string): void {
    this.track('view.changed', { from: fromView, to: toView });
  }

  // Track feature usage
  trackFeature(feature: string): void {
    this.track(`feature.${feature}.used`);
  }

  // Calculate task completion time
  private calculateCompletionTime(task: Task): number {
    if (task.completedAt && task.createdAt) {
      return new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
    }
    return 0;
  }

  // Get user ID
  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const token = localStorage.getItem('accessToken');
    if (!token) return undefined;

    try {
      // Simple token decode (in production, use proper JWT decode)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub;
    } catch {
      return undefined;
    }
  }

  // Get events
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Get metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get behavior patterns
  getBehavior(): Map<string, UserBehavior> {
    return new Map(this.behavior);
  }

  // Clear events
  clearEvents(): void {
    this.events = [];
    this.persistEvents();
  }

  // Persist events to storage
  private persistEvents(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('todo-elephant-analytics', JSON.stringify({
          events: this.events.slice(-100), // Keep last 100 events
          metrics: this.metrics.slice(-100),
          behavior: Array.from(this.behavior.entries()),
        }));
      } catch (e) {
        console.error('Failed to persist analytics:', e);
      }
    }
  }

  // Load events from storage
  loadEvents(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('todo-elephant-analytics');
        if (stored) {
          const data = JSON.parse(stored);
          this.events = data.events || [];
          this.metrics = data.metrics || [];
          this.behavior = new Map(data.behavior || []);
        }
      } catch (e) {
        console.error('Failed to load analytics:', e);
      }
    }
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('analytics-consent', enabled.toString());
  }

  // Export data
  exportData(): string {
    return JSON.stringify({
      events: this.events,
      metrics: this.metrics,
      behavior: Array.from(this.behavior.entries()),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Auto-load events on module load
if (typeof window !== 'undefined') {
  analytics.loadEvents();
}

export const { calculateCognitiveLoad, analyzeProductivityDNA, calculateTimeInvestment, assessDecisionFatigue, generateActivityHeatmap } = {
  calculateCognitiveLoad,
  analyzeProductivityDNA,
  calculateTimeInvestment,
  assessDecisionFatigue,
  generateActivityHeatmap
};

/**
 * Calculate cognitive load based on task complexity and quantity.
 * Factors: word count, number of tasks, descriptions with complex language.
 */
export function calculateCognitiveLoad(tasks: Task[]): CognitiveLoad {
  const incompleteTasks = tasks.filter(t => !isCompletedStatus(t.status));

  let score = 0;
  const factors: string[] = [];

  // Task quantity factor
  if (incompleteTasks.length > 10) {
    score += 30;
    factors.push("High task volume");
  } else if (incompleteTasks.length > 5) {
    score += 15;
    factors.push("Moderate task volume");
  }

  // Task description complexity
  const totalWordCount = incompleteTasks.reduce((sum, t) => {
    return sum + (t.description?.split(/\s+/).length ?? 0) + (t.title.split(/\s+/).length);
  }, 0);

  const avgWords = incompleteTasks.length > 0 ? totalWordCount / incompleteTasks.length : 0;
  if (avgWords > 50) {
    score += 25;
    factors.push("Complex task descriptions");
  } else if (avgWords > 25) {
    score += 10;
    factors.push("Moderate task complexity");
  }

  // Task interleaving (many small tasks = high switching cost)
  const hasManySubtasks = incompleteTasks.filter(t => (t.subtasks?.length ?? 0) > 5).length;
  if (hasManySubtasks > 3) {
    score += 20;
    factors.push("Frequent context switching needed");
  }

  // Priority pressure
  const highPriorityCount = incompleteTasks.filter(t => t.priority === "high").length;
  if (highPriorityCount > incompleteTasks.length * 0.5) {
    score += 25;
    factors.push("High priority overload");
  }

  let level: "low" | "medium" | "high" = "low";
  if (score > 60) level = "high";
  else if (score > 30) level = "medium";

  return { score, level, factors };
}

/**
 * Analyze productivity patterns from historical task data.
 */
export function analyzeProductivityDNA(tasks: Task[], focusSessions: FocusSession[]): ProductivityDNA {
  // Analyze completion by hour
  const completionsByHour: Record<number, { completed: number; total: number }> = {};

  for (let i = 0; i < 24; i++) {
    completionsByHour[i] = { completed: 0, total: 0 };
  }

  tasks.forEach(task => {
    if (isCompletedStatus(task.status)) {
      const hour = task.completedAt ? new Date(task.completedAt).getUTCHours() : 12;
      completionsByHour[hour].completed++;
    }
    completionsByHour[new Date(task.createdAt).getUTCHours()].total++;
  });

  // Find peak hours (hours with > 70% completion rate and at least 1 completion)
  const peakHours = Object.entries(completionsByHour)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      completionRate: stats.total > 0 ? stats.completed / stats.total : 0,
    }))
    .filter(h => h.completionRate > 0.7 && completionsByHour[h.hour].completed > 0)
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 3);

  // Calculate average task time from focus sessions
  const avgTaskTime = focusSessions.length > 0
    ? focusSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / focusSessions.length / 60
    : 25;

  // Determine work style
  const workStyle = determineWorkStyle(tasks, focusSessions);

  // Find preferred patterns
  const patterns: string[] = [];
  if (peakHours.length > 0) {
    patterns.push(`Most productive around ${peakHours.map(h => formatHour(h.hour)).join(", ")}`);
  }
  const hasPatterns = tasks.filter(t => t.isImportant || t.isUrgent).length > tasks.length * 0.3;
  if (hasPatterns) {
    patterns.push("Tends to prioritize urgent/important tasks");
  }

  return {
    peakHours,
    averageTaskTime: avgTaskTime,
    preferredWorkPatterns: patterns,
    workStyle,
  };
}

function determineWorkStyle(tasks: Task[], focusSessions: FocusSession[]): "deep-focus" | "multitasking" | "spread-out" {
  // Deep focus: few tasks, long focus sessions
  const longSessions = focusSessions.filter(s => s.durationSeconds > 1500).length;
  if (tasks.length < 20 && longSessions > focusSessions.length * 0.5) {
    return "deep-focus";
  }

  // Multitasking: many short focus sessions
  const shortSessions = focusSessions.filter(s => s.durationSeconds < 600).length;
  if (shortSessions > focusSessions.length * 0.4) {
    return "multitasking";
  }

  return "spread-out";
}

function formatHour(hour: number): string {
  const base = hour % 12 || 12;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${base}${suffix}`;
}

/**
 * Calculate time investment breakdown.
 */
export function calculateTimeInvestment(tasks: Task[], focusSessions: FocusSession[]): TimeInvestment {
  const totalTime = focusSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60;

  // By priority
  const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0 };
  focusSessions.forEach(session => {
    const task = tasks.find(t => t.id === session.taskId);
    if (task) {
      byPriority[task.priority] = (byPriority[task.priority] ?? 0) + session.durationSeconds / 60;
    }
  });

  // By label (requires tasks to have labels)
  const byLabel: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.labels && task.completedPomodoros !== undefined) {
      task.labels.forEach(labelId => {
        byLabel[`label-${labelId}`] = (byLabel[`label-${labelId}`] ?? 0) + (task.completedPomodoros ?? 0) * 25;
      });
    }
  });

  // By hour
  const byHour: Record<string, number> = {};
  focusSessions.forEach(session => {
    const hour = new Date(session.startedAt).getUTCHours();
    byHour[`${hour}:00`] = (byHour[`${hour}:00`] ?? 0) + session.durationSeconds / 60;
  });

  return {
    totalTimeMinutes: totalTime,
    byPriority,
    byLabel,
    byHour,
  };
}

/**
 * Assess decision fatigue risk based on task volume and complexity.
 */
export function assessDecisionFatigue(tasks: Task[]): DecisionFatigue {
  const incompleteTasks = tasks.filter(t => !isCompletedStatus(t.status));
  const pendingCount = incompleteTasks.filter(t => t.status === "pending").length;

  let score = 0;

  // More pending tasks = higher fatigue
  if (pendingCount > 20) {
    score += 50;
  } else if (pendingCount > 10) {
    score += 30;
  } else if (pendingCount > 5) {
    score += 15;
  }

  // Similar tasks increase decision difficulty
  const similarTitles = findSimilarTaskGroups(tasks);
  score += similarTitles.length * 10;

  // Tasks with no clear priority direction
  const noPriority = incompleteTasks.filter(t => !t.isImportant && !t.isUrgent && t.priority !== "high").length;
  score += noPriority * 2;

  const warning = score > 50;
  let recommendation = "Your task load looks manageable.";

  if (warning) {
    recommendation = "Consider breaking down complex tasks or prioritizing the top 3 for today.";
  } else if (score > 30) {
    recommendation = "Try picking 2-3 priority tasks for focused work sessions.";
  }

  return { score, warning, recommendation };
}

/**
 * Find groups of tasks with similar titles (potential decision difficulty).
 */
function findSimilarTaskGroups(tasks: Task[]): Task[][] {
  const groups: Task[][] = [];
  const processed = new Set<number>();

  tasks.forEach(task => {
    if (processed.has(task.id)) return;

    const similar = tasks.filter(other => {
      if (processed.has(other.id)) return false;
      const similarity = stringSimilarity(task.title.toLowerCase(), other.title.toLowerCase());
      return similarity > 0.5 && task.id !== other.id;
    });

    if (similar.length > 2) {
      groups.push([task, ...similar]);
      processed.add(task.id);
      similar.forEach(t => processed.add(t.id));
    }
  });

  return groups;
}

function stringSimilarity(a: string, b: string): number {
  const pairs = [...a].filter((c, i) => c === b[i]).length;
  return pairs / Math.max(a.length, b.length);
}

/**
 * Heatmap data for visualization.
 */
export function generateActivityHeatmap(tasks: Task[], days: number = 30): { date: string; count: number; intensity: number }[] {
  const today = new Date();
  const heatmap = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const count = tasks.filter(t => {
      if (!isCompletedStatus(t.status)) return false;
      const refDate = t.completedAt?.split("T")[0] ?? t.updatedAt?.split("T")[0] ?? t.createdAt?.split("T")[0];
      return refDate === dateStr;
    }).length;

    const intensity = count > 0 ? Math.min(1, count / 5) : 0;

    heatmap.push({ date: dateStr, count, intensity });
  }

  return heatmap;
}