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