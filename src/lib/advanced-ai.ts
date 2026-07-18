/**
 * Advanced AI Features Module
 * Includes smart scheduling, predictive analytics, and intelligent automation
 */

export interface SmartScheduleResult {
  scheduledTasks: Array<{
    taskId: string;
    suggestedStartTime: Date;
    suggestedEndTime: Date;
    confidence: number;
    reasoning: string;
  }>;
  totalEstimatedHours: number;
  optimizationScore: number;
}

export interface PredictiveAnalytics {
  burnoutRisk: number; // 0-100
  productivityForecast: Array<{ date: Date; predictedCompletion: number }>;
  optimalWorkHours: Array<{ hour: number; productivity: number }>;
  taskCompletionProbability: Record<string, number>;
  recommendedBreaks: Array<{ time: Date; duration: number; type: 'micro' | 'short' | 'long' }>;
}

export interface SmartAutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'task_created' | 'task_completed' | 'deadline_approaching' | 'pattern_detected' | 'time_based';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'create_task' | 'send_notification' | 'update_task' | 'move_task' | 'assign_task' | 'schedule_focus';
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
  createdAt: Date;
  executionCount: number;
}

export class AdvancedAIEngine {
  /**
   * Generate intelligent schedule based on user patterns and task priorities
   */
  async generateSmartSchedule(
    tasks: any[],
    userPatterns: any,
    constraints: {
      workHours: { start: number; end: number };
      maxDailyHours: number;
      preferredBreakLength: number;
      focusSessionLength: number;
    }
  ): Promise<SmartScheduleResult> {
    // Sort tasks by priority and deadline
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority as keyof typeof priorityWeight] || 1;
      const bPriority = priorityWeight[b.priority as keyof typeof priorityWeight] || 1;

      const aUrgency = a.dueDate ? (new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 999;
      const bUrgency = b.dueDate ? (new Date(b.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 999;

      return (bPriority * 10 + (100 - aUrgency)) - (aPriority * 10 + (100 - bUrgency));
    });

    const scheduledTasks: SmartScheduleResult['scheduledTasks'] = [];
    let currentTime = new Date();
    currentTime.setHours(constraints.workHours.start, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(constraints.workHours.end, 0, 0, 0);
    let totalHours = 0;

    for (const task of sortedTasks) {
      const estimatedHours = (task.estimatedMinutes || 60) / 60;

      if (totalHours + estimatedHours > constraints.maxDailyHours) {
        // Move to next day
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(constraints.workHours.start, 0, 0, 0);
        totalHours = 0;
      }

      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + estimatedHours * 60 * 60 * 1000);

      scheduledTasks.push({
        taskId: task.id,
        suggestedStartTime: startTime,
        suggestedEndTime: endTime,
        confidence: this.calculateScheduleConfidence(task, userPatterns, startTime),
        reasoning: this.generateScheduleReasoning(task, userPatterns, startTime)
      });

      currentTime = new Date(endTime.getTime() + constraints.preferredBreakLength * 60 * 1000);
      totalHours += estimatedHours + (constraints.preferredBreakLength / 60);
    }

    return {
      scheduledTasks,
      totalEstimatedHours: totalHours,
      optimizationScore: this.calculateOptimizationScore(scheduledTasks, userPatterns)
    };
  }

  /**
   * Generate predictive analytics for user productivity
   */
  async generatePredictiveAnalytics(
    tasks: any[],
    focusSessions: any[],
    userPatterns: any
  ): Promise<PredictiveAnalytics> {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');

    // Burnout risk calculation
    const overdueCount = incompleteTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
    const highPriorityCount = incompleteTasks.filter(t => t.priority === 'high').length;
    const recentFocusHours = focusSessions
      .filter(s => s.completed && new Date(s.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 3600;

    const burnoutRisk = Math.min(100,
      overdueCount * 15 +
      highPriorityCount * 10 +
      (recentFocusHours > 30 ? 20 : 0) +
      (completedTasks.length === 0 ? 30 : 0)
    );

    // Productivity forecast for next 7 days
    const productivityForecast = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const historicalProductivity = userPatterns.dailyProductivity?.[dayOfWeek] || 0.5;
      return {
        date,
        predictedCompletion: Math.round(historicalProductivity * incompleteTasks.length * 0.3)
      };
    });

    // Optimal work hours based on focus session history
    const hourProductivity: Record<number, number[]> = {};
    focusSessions.filter(s => s.completed).forEach(session => {
      const hour = new Date(session.startTime).getHours();
      if (!hourProductivity[hour]) hourProductivity[hour] = [];
      hourProductivity[hour].push(session.durationSeconds || 0);
    });

    const optimalWorkHours = Object.entries(hourProductivity)
      .map(([hour, durations]) => ({
        hour: parseInt(hour),
        productivity: durations.reduce((a, b) => a + b, 0) / durations.length / 3600
      }))
      .sort((a, b) => b.productivity - a.productivity)
      .slice(0, 5);

    // Task completion probability
    const taskCompletionProbability: Record<string, number> = {};
    incompleteTasks.forEach(task => {
      let probability = 0.5;
      if (task.priority === 'high') probability += 0.2;
      if (task.priority === 'low') probability -= 0.1;
      if (task.dueDate) {
        const daysUntilDue = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilDue < 1) probability += 0.3;
        else if (daysUntilDue < 3) probability += 0.15;
      }
      if (task.estimatedMinutes && task.estimatedMinutes < 30) probability += 0.1;
      taskCompletionProbability[task.id] = Math.min(0.95, Math.max(0.05, probability));
    });

    // Recommended breaks
    const recommendedBreaks: PredictiveAnalytics['recommendedBreaks'] = [];
    if (recentFocusHours > 4) {
      recommendedBreaks.push({
        time: new Date(Date.now() + 90 * 60 * 1000),
        duration: 15,
        type: 'short'
      });
    }
    if (recentFocusHours > 8) {
      recommendedBreaks.push({
        time: new Date(Date.now() + 4 * 60 * 60 * 1000),
        duration: 30,
        type: 'long'
      });
    }

    return {
      burnoutRisk,
      productivityForecast,
      optimalWorkHours,
      taskCompletionProbability,
      recommendedBreaks
    };
  }

  /**
   * Create smart automation rules based on user behavior
   */
  async generateAutomationRules(
    tasks: any[],
    userPatterns: any
  ): Promise<SmartAutomationRule[]> {
    const rules: SmartAutomationRule[] = [];

    // Rule 1: Auto-breakdown large tasks
    const largeTasks = tasks.filter(t =>
      t.title.length > 100 ||
      (t.estimatedMinutes && t.estimatedMinutes > 120) ||
      (t.description && t.description.length > 500)
    );

    if (largeTasks.length > 0) {
      rules.push({
        id: `auto-breakdown-${Date.now()}`,
        name: 'Auto-breakdown Large Tasks',
        trigger: {
          type: 'task_created',
          conditions: {
            estimatedMinutes: { $gt: 120 },
            or: [
              { titleLength: { $gt: 100 } },
              { descriptionLength: { $gt: 500 } }
            ]
          }
        },
        actions: [
          {
            type: 'create_task',
            parameters: {
              template: 'breakdown',
              parentTaskId: '{{trigger.task.id}}',
              subtasks: ['Analyze requirements', 'Design approach', 'Implement core', 'Test & review']
            }
          },
          {
            type: 'send_notification',
            parameters: {
              message: 'Large task detected. Consider breaking it down into smaller subtasks.',
              type: 'suggestion'
            }
          }
        ],
        isActive: true,
        createdAt: new Date(),
        executionCount: 0
      });
    }

    // Rule 2: Deadline approaching notifications
    rules.push({
      id: `deadline-approaching-${Date.now()}`,
      name: 'Deadline Approaching Alerts',
      trigger: {
        type: 'time_based',
        conditions: {
          schedule: 'daily_at_9am',
          taskFilter: {
            status: { $in: ['todo', 'in_progress'] },
            dueDate: { $lte: '{{now + 24h}}' }
          }
        }
      },
      actions: [
        {
          type: 'send_notification',
          parameters: {
            message: 'You have {{count}} task(s) due tomorrow. Prioritize them today!',
            type: 'warning'
          }
        },
        {
          type: 'update_task',
          parameters: {
            filter: { dueDate: { $lte: '{{now + 24h}}' } },
            updates: { isUrgent: true }
          }
        }
      ],
      isActive: true,
      createdAt: new Date(),
      executionCount: 0
    });

    // Rule 3: Productivity pattern detection
    const morningProductivity = userPatterns.dailyProductivity?.[1] || 0; // Monday
    if (morningProductivity > 0.7) {
      rules.push({
        id: `morning-focus-${Date.now()}`,
        name: 'Morning Focus Session Scheduler',
        trigger: {
          type: 'time_based',
          conditions: {
            schedule: 'weekday_at_8am',
            userPattern: { morningProductivity: { $gt: 0.7 } }
          }
        },
        actions: [
          {
            type: 'schedule_focus',
            parameters: {
              duration: 90,
              taskFilter: { priority: 'high', status: 'todo' },
              message: 'Your most productive time! Starting a 90-min focus session on your top priority.'
            }
          }
        ],
        isActive: true,
        createdAt: new Date(),
        executionCount: 0
      });
    }

    // Rule 4: Stale task cleanup
    rules.push({
      id: `stale-cleanup-${Date.now()}`,
      name: 'Stale Task Review',
      trigger: {
        type: 'time_based',
        conditions: {
          schedule: 'weekly_monday_9am',
          taskFilter: {
            status: { $in: ['todo', 'in_progress'] },
            updatedAt: { $lt: '{{now - 14d}}' }
          }
        }
      },
      actions: [
        {
          type: 'send_notification',
          parameters: {
            message: 'You have {{count}} tasks that haven\'t been updated in 2 weeks. Review or archive them?',
            type: 'info'
          }
        },
        {
          type: 'update_task',
          parameters: {
            filter: { updatedAt: { $lt: '{{now - 30d}}' } },
            updates: { status: 'archived' }
          }
        }
      ],
      isActive: true,
      createdAt: new Date(),
      executionCount: 0
    });

    return rules;
  }

  private calculateScheduleConfidence(task: any, userPatterns: any, startTime: Date): number {
    let confidence = 0.7;
    const hour = startTime.getHours();

    // Check if this hour matches user's productive hours
    if (userPatterns.productiveHours?.includes(hour)) confidence += 0.15;

    // High priority tasks scheduled earlier = higher confidence
    if (task.priority === 'high' && hour < 12) confidence += 0.1;

    // Check if task type matches time of day
    if (task.category === 'creative' && hour >= 9 && hour <= 11) confidence += 0.1;
    if (task.category === 'admin' && hour >= 14 && hour <= 16) confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  private generateScheduleReasoning(task: any, userPatterns: any, startTime: Date): string {
    const hour = startTime.getHours();
    const reasons: string[] = [];

    if (userPatterns.productiveHours?.includes(hour)) {
      reasons.push(`Scheduled during your peak productivity hour (${hour}:00)`);
    }

    if (task.priority === 'high' && hour < 12) {
      reasons.push('High priority task scheduled for morning when focus is highest');
    }

    if (task.category === 'creative' && hour >= 9 && hour <= 11) {
      reasons.push('Creative work scheduled during optimal morning window');
    }

    if (reasons.length === 0) {
      reasons.push('Scheduled based on priority and availability');
    }

    return reasons.join('; ');
  }

  private calculateOptimizationScore(scheduledTasks: SmartScheduleResult['scheduledTasks'], userPatterns: any): number {
    if (scheduledTasks.length === 0) return 0;

    const avgConfidence = scheduledTasks.reduce((sum, t) => sum + t.confidence, 0) / scheduledTasks.length;
    const highPriorityMorning = scheduledTasks.filter(t => {
      const hour = t.suggestedStartTime.getHours();
      return t.taskId && hour < 12; // Would need task priority check
    }).length;

    return Math.round((avgConfidence * 0.7 + (highPriorityMorning / scheduledTasks.length) * 0.3) * 100);
  }
}

export const advancedAIEngine = new AdvancedAIEngine();