"use client";

import { useState, useCallback, useMemo } from 'react';
import { Task } from '@/types';

export interface ScheduledTask {
  taskId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  confidence: number; // 0-1
  reasoning: string;
}

export interface ScheduleSuggestion {
  slot: {
    start: Date;
    end: Date;
  };
  tasks: ScheduledTask[];
  totalDuration: number;
  confidence: number;
}

export interface SmartScheduleConfig {
  workHours?: { start: number; end: number }; // 0-23
  breakInterval?: number; // minutes
  breakDuration?: number; // minutes
  targetCompletionRate?: number; // 0-1
  includeBuffer?: boolean;
  bufferDuration?: number; // minutes
}

const DEFAULT_CONFIG: SmartScheduleConfig = {
  workHours: { start: 9, end: 17 },
  breakInterval: 60,
  breakDuration: 10,
  targetCompletionRate: 0.8,
  includeBuffer: true,
  bufferDuration: 15
};

export function useSmartScheduler(config: SmartScheduleConfig = {}) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [suggestion, setSuggestion] = useState<ScheduleSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const generateSmartSchedule = useCallback(async (
    tasks: Task[],
    options?: Partial<SmartScheduleConfig>
  ): Promise<ScheduleSuggestion> => {
    setIsScheduling(true);
    setError(null);

    try {
      const effectiveConfig = { ...mergedConfig, ...options };
      const incompleteTasks = tasks.filter(t =>
        t.status !== 'completed' && t.status !== 'done' && t.status !== 'archived'
      );

      // Sort tasks by priority and due date
      const sortedTasks = [...incompleteTasks].sort((a, b) => {
        // High priority first
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;

        // Then by due date (overdue first)
        const now = new Date();
        const aOverdue = a.dueDate ? new Date(a.dueDate) < now : false;
        const bOverdue = b.dueDate ? new Date(b.dueDate) < now : false;

        if (aOverdue && !bOverdue) return -1;
        if (bOverdue && !aOverdue) return 1;

        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }

        return 0;
      });

      // Generate schedule slots for the next 5 days
      const schedule = generateSlotsForWeek(
        sortedTasks,
        effectiveConfig,
        new Date()
      );

      const result: ScheduleSuggestion = {
        slot: schedule[0]?.slot || { start: new Date(), end: new Date() },
        tasks: schedule.flatMap(s => s.tasks),
        totalDuration: schedule.reduce((sum, s) => sum + s.totalDuration, 0),
        confidence: calculateConfidence(schedule, incompleteTasks.length)
      };

      setSuggestion(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate schedule';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsScheduling(false);
    }
  }, [mergedConfig]);

  const getCurrentDaySchedule = useCallback((): Promise<ScheduleSuggestion> => {
    const today = new Date();
    today.setHours(mergedConfig.workHours!.start, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(mergedConfig.workHours!.end, 0, 0, 0);

    return {
      slot: { start: today, end: endOfDay },
      tasks: [],
      totalDuration: 0,
      confidence: 0.5
    };
  }, [mergedConfig]);

  return {
    generateSmartSchedule,
    getCurrentDaySchedule,
    isScheduling,
    suggestion,
    error,
    config: mergedConfig
  };
}

// Generate slots for a week
function generateSlotsForWeek(
  tasks: Task[],
  config: SmartScheduleConfig,
  startDate: Date
): ScheduleSuggestion[] {
  const slots: ScheduleSuggestion[] = [];
  const workStart = config.workHours!.start;
  const workEnd = config.workHours!.end;

  // Create slots for each workday
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);

    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    let currentTime = new Date(date);
    currentTime.setHours(workStart, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(workEnd, 0, 0, 0);

    const dayTasks: ScheduledTask[] = [];
    let slotTasks: ScheduledTask[] = [];
    let slotStart = new Date(currentTime);

    // Assign tasks to time slots
    for (const task of tasks) {
      const estimatedMinutes = task.estimatedMinutes || 30;
      const taskEnd = new Date(currentTime.getTime() + estimatedMinutes * 60000);

      if (taskEnd > dayEnd) break; // No more time today

      const scheduledTask: ScheduledTask = {
        taskId: task.id.toString(),
        title: task.title,
        startTime: new Date(currentTime),
        endTime: taskEnd,
        duration: estimatedMinutes,
        confidence: calculateTaskConfidence(task),
        reasoning: getTaskReasoning(task)
      };

      slotTasks.push(scheduledTask);
      currentTime = taskEnd;

      // Add break
      currentTime = new Date(currentTime.getTime() + config.breakDuration! * 60000);

      // Create slot when we have tasks or hit a limit
      if (slotTasks.length >= 3 || currentTime >= dayEnd) {
        if (slotTasks.length > 0) {
          slots.push({
            slot: { start: slotStart, end: new Date(currentTime) },
            tasks: slotTasks,
            totalDuration: slotTasks.reduce((sum, t) => sum + t.duration, 0),
            confidence: calculateSlotConfidence(slotTasks)
          });
        }
        slotTasks = [];
        slotStart = new Date(currentTime);
      }
    }

    // Add remaining tasks for the day
    if (slotTasks.length > 0) {
      slots.push({
        slot: { start: slotStart, end: new Date(currentTime) },
        tasks: slotTasks,
        totalDuration: slotTasks.reduce((sum, t) => sum + t.duration, 0),
        confidence: calculateSlotConfidence(slotTasks)
      });
    }
  }

  return slots;
}

function calculateTaskConfidence(task: Task): number {
  let confidence = 0.5;

  // Higher confidence for tasks with estimates
  if (task.estimatedMinutes) confidence += 0.3;

  // Higher confidence for high priority
  if (task.priority === 'high') confidence += 0.2;

  // Lower confidence for tasks without due dates
  if (!task.dueDate) confidence -= 0.2;

  return Math.min(1, Math.max(0, confidence));
}

function calculateSlotConfidence(tasks: ScheduledTask[]): number {
  if (tasks.length === 0) return 0;

  const avgConfidence = tasks.reduce((sum, t) => sum + t.confidence, 0) / tasks.length;
  return Math.round(avgConfidence * 100) / 100;
}

function calculateConfidence(slots: ScheduleSuggestion[], totalTasks: number): number {
  if (slots.length === 0) return 0;

  const totalConfidence = slots.reduce((sum, s) => sum + s.confidence, 0);
  const avgConfidence = totalConfidence / slots.length;

  // Adjust based on task coverage
  const scheduledTasks = slots.flatMap(s => s.tasks).length;
  const coverage = totalTasks > 0 ? scheduledTasks / totalTasks : 1;

  return Math.round((avgConfidence * coverage) * 100) / 100;
}

function getTaskReasoning(task: Task): string {
  const reasons: string[] = [];

  if (task.priority === 'high') reasons.push('high priority');
  if (task.dueDate) reasons.push('has deadline');
  if (task.estimatedMinutes) reasons.push('time estimate available');

  const now = new Date();
  if (task.dueDate && new Date(task.dueDate) < now) {
    reasons.push('overdue');
  }

  return reasons.length > 0
    ? `Scheduled as ${reasons.join(', ')}`
    : 'Standard scheduling';
}

// Hook for calendar-aware scheduling
export function useCalendarAwareScheduler() {
  const [events, setEvents] = useState<Array<{
    start: Date;
    end: Date;
    title: string;
  }>>([]);

  const findAvailableSlots = useCallback(async (
    durationMinutes: number,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ start: Date; end: Date }>> => {
    const slots: Array<{ start: Date; end: Date }> = [];

    // Check each day in range
    const current = new Date(startDate);

    while (current < endDate) {
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);

      // Find gaps in calendar events
      const busyPeriods = events
        .filter(e => e.start >= current && e.end <= dayEnd)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      let slotStart = new Date(current);

      for (const busy of busyPeriods) {
        // Check if there's enough time before this busy period
        const gapMinutes = (busy.start.getTime() - slotStart.getTime()) / 60000;

        if (gapMinutes >= durationMinutes) {
          slots.push({
            start: new Date(slotStart),
            end: new Date(slotStart.getTime() + durationMinutes * 60000)
          });
        }

        slotStart = busy.end;
      }

      // Check remaining time after last busy period
      const remainingMinutes = (dayEnd.getTime() - slotStart.getTime()) / 60000;
      if (remainingMinutes >= durationMinutes) {
        slots.push({
          start: new Date(slotStart),
          end: new Date(slotStart.getTime() + durationMinutes * 60000)
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }, [events]);

  return {
    events,
    setEvents,
    findAvailableSlots
  };
}