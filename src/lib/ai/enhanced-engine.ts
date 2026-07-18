// Enhanced AI Engine with predictive intelligence, prioritization, and forecasting
import OpenAI from 'openai';
import { TaskModel } from '@/models/task.model';
import { UserModel } from '@/models/user.model';
import { calculateWorkloadCapacity } from './workload-calculator';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

export interface TaskPrioritization {
  taskId: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  confidence: number;
  suggestedTimeSlot?: { start: Date; end: Date };
}

export interface WorkloadForecast {
  dailyCapacity: number;
  predictedCompletion: Array<{
    date: Date;
    predictedTasks: number;
    confidence: number;
    riskFactors: string[];
  }>;
  optimalScheduling: Array<{
    taskId: string;
    suggestedStart: Date;
    suggestedEnd: Date;
    reasoning: string;
  }>;
  workloadWarnings: string[];
}

export interface ContextAwareSuggestion {
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedMinutes: number;
  reason: string;
  confidence: number;
  dependencies?: string[];
}

export class EnhancedAIEngine {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Priority tasks based on multiple factors
   */
  async prioritizeTasks(taskIds: string[], context: string = ''): Promise<TaskPrioritization[]> {
    const tasks = await TaskModel.find({ _id: { $in: taskIds }, userId: this.userId });
    const user = await UserModel.findById(this.userId);

    if (!user) throw new Error('User not found');

    // Get historical performance data
    const historicalData = await this.getUserHistoricalData();

    // Get AI-powered prioritization
    const prompt = this.buildPrioritizationPrompt(tasks, context, historicalData);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a task prioritization expert. Analyze the given tasks and provide precise prioritization with reasoning.

            Consider:
            1. Due dates and deadlines
            2. Dependencies between tasks
            3. User's historical completion patterns
            4. Task complexity and estimated effort
            5. Current context and workload

            Return ONLY valid JSON with this exact structure:
            {"prioritizations": [{"taskId": "...", "priority": "high|medium|low", "reason": "...", "confidence": 0.0-1.0, "suggestedTimeSlot": {"start": "...", "end": "..."}}]}`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      return data.prioritizations || [];
    } catch (error) {
      console.error('AI prioritization error:', error);
      return this.getFallbackPrioritization(tasks);
    }
  }

  /**
   * Forecast workload for upcoming period
   */
  async forecastWorkload(
    lookaheadDays: number = 7,
    includeTrends: boolean = true
  ): Promise<WorkloadForecast> {
    const tasks = await TaskModel.find({ userId: this.userId });
    const user = await UserModel.findById(this.userId);

    if (!user) throw new Error('User not found');

    const historicalData = await this.getUserHistoricalData();
    const capacity = calculateWorkloadCapacity(user, historicalData);

    const prompt = this.buildForecastPrompt(tasks, lookaheadDays, capacity, historicalData);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a workload forecasting expert. Predict task completion likelihood and identify scheduling opportunities.

            Return ONLY valid JSON with this exact structure:
            {"dailyCapacity": N, "predictedCompletion": [{"date": "...", "predictedTasks": N, "confidence": 0.0-1.0, "riskFactors": [...]}], "optimalScheduling": [...], "workloadWarnings": []}`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      });\n      const data = JSON.parse(response.choices[0].message.content || '{}');
      return {
        dailyCapacity: data.dailyCapacity || capacity,
        predictedCompletion: data.predictedCompletion || [],
        optimalScheduling: data.optimalScheduling || [],
        workloadWarnings: data.workloadWarnings || [],
      };
    } catch (error) {
      console.error('AI forecast error:', error);
      return this.getFallbackForecast(tasks, lookaheadDays, capacity);
    }
  }

  /**
   * Generate context-aware suggestions
   */
  async generateContextAwareSuggestions(context: string = ''): Promise<ContextAwareSuggestion[]> {
    const tasks = await TaskModel.find({ userId: this.userId });
    const user = await UserModel.findById(this.userId);

    if (!user) throw new Error('User not found');

    const prompt = this.buildContextPrompt(tasks, context);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are Todo Elephant's context-aware AI assistant. Generate actionable, specific suggestions based on the user's current context, task history, and productivity patterns.

            Return ONLY valid JSON with this exact structure:
            {"suggestions": [{"title": "...", "priority": "high|medium|low", "category": "...", "estimatedMinutes": N, "reason": "...", "confidence": 0.0-1.0, "dependencies": [...]}]}`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      return data.suggestions || [];
    } catch (error) {
      console.error('AI suggestion error:', error);
      return this.getFallbackSuggestions(tasks);
    }
  }

  /**
   * Analyze user historical data
   */
  private async getUserHistoricalData() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const completedTasks = await TaskModel.find({
      userId: this.userId,
      status: 'completed',
      completedAt: { $gte: cutoffDate }
    });

    const incompleteTasks = await TaskModel.find({
      userId: this.userId,
      status: { $ne: 'completed' }
    });

    const completionByHour: Record<number, number> = {};
    const hourTimes: Record<number, number[]> = {};

    completedTasks.forEach(task => {
      const hour = task.completedAt?.getHours() || 0;
      completionByHour[hour] = (completionByHour[hour] || 0) + 1;
      if (task.completedAt && task.createdAt) {
        const time = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
        hourTimes[hour] = [...(hourTimes[hour] || []), time];
      }
    });

    const avgCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          const start = new Date(task.createdAt);
          const end = task.completedAt ? new Date(task.completedAt) : Date.now();
          return sum + (end.getTime() - start.getTime());
        }, 0) / completedTasks.length
      : 0;

    return {
      completedCount: completedTasks.length,
      incompleteCount: incompleteTasks.length,
      completionByHour,
      avgCompletionTime,
      taskPatterns: this.extractTaskPatterns(completedTasks),
    };
  }

  private extractTaskPatterns(tasks: any[]) {
    const patterns: Record<string, any> = {};

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    tasks.forEach(task => {
      const category = task.category || 'general';
      byCategory[category] = (byCategory[category] || 0) + 1;

      const priority = task.priority || 'medium';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    });

    patterns.mostCompletedCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    patterns.preferredPriorities = Object.entries(byPriority)
      .sort((a, b) => b[1] - a[1])
      .map(([prio]) => prio);

    return patterns;
  }

  private buildPrioritizationPrompt(tasks: any[], context: string, historicalData: any): string {
    const taskList = tasks.map(t => `
      Task: ${t.title}
      Priority: ${t.priority}
      Due Date: ${t.dueDate || 'No deadline'}
      Estimated Minutes: ${t.estimatedMinutes || 'Unknown'}
      Category: ${t.category || 'General'}
    `).join('\n');

    return `
Current Context: ${context || 'No specific context provided'}

User Historical Data:
- Completed Tasks (90 days): ${historicalData.completedCount}
- Incomplete Tasks: ${historicalData.incompleteCount}
- Average Completion Time: ${Math.round(historicalData.avgCompletionTime / 60000)} minutes
- Most Completed Categories: ${historicalData.taskPatterns.mostCompletedCategories.join(', ')}

Tasks to Prioritize:
${taskList}

Provide precise prioritization considering all factors above.`;
  }

  private buildForecastPrompt(tasks: any[], lookaheadDays: number, capacity: number, historicalData: any): string {
    const incomplete = tasks.filter(t => t.status !== 'completed');
    const overdue = incomplete.filter(t => t.dueDate && new Date(t.dueDate) < new Date());

    return `
User Capacity: ${capacity} hours/day
Lookahead: ${lookaheadDays} days

Incomplete Tasks: ${incomplete.length}
Overdue Tasks: ${overdue.length}

Historical Completion Rate: ${(historicalData.completedCount / (historicalData.completedCount + historicalData.incompleteCount) * 100).toFixed(1)}%

Tasks:
${incomplete.map(t => `- ${t.title} (due: ${t.dueDate || 'none'}, priority: ${t.priority})`).join('\n')}

Forecast completion likelihood for each day.`;
  }

  private buildContextPrompt(tasks: any[], context: string): string {
    const now = new Date();
    const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening';

    const incomplete = tasks.filter(t => t.status !== 'completed');

    return `
Current Context: ${context || 'General productivity enhancement'}

Day: ${dayOfWeek}
Time: ${timeOfDay} (${now.getHours()}:00)

User has ${incomplete.length} incomplete tasks.

Generate 5 context-aware suggestions that would be valuable right now.`;
  }

  private getFallbackPrioritization(tasks: any[]): TaskPrioritization[] {
    return tasks.map(task => ({
      taskId: task._id.toString(),
      priority: task.priority,
      reason: 'Default prioritization based on existing priority field',
      confidence: 0.5,
      suggestedTimeSlot: task.dueDate
        ? { start: new Date(task.dueDate), end: new Date(new Date(task.dueDate).getTime() + task.estimatedMinutes * 60000) }
        : undefined,
    }));
  }

  private getFallbackForecast(tasks: any[], lookaheadDays: number, capacity: number): WorkloadForecast {
    const incomplete = tasks.filter(t => t.status !== 'completed');
    const predictedCompletion = [];

    for (let i = 0; i < lookaheadDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dailyTasks = Math.min(
        capacity,
        Math.ceil(incomplete.length / lookaheadDays)
      );

      predictedCompletion.push({
        date,
        predictedTasks: dailyTasks,
        confidence: 0.6,
        riskFactors: incomplete.length > 10 ? ['High task backlog'] : [],
      });
    }

    return {
      dailyCapacity: capacity,
      predictedCompletion,
      optimalScheduling: [],
      workloadWarnings: incomplete.length > capacity * lookaheadDays ? ['Potential overload detected'] : [],
    };
  }

  private getFallbackSuggestions(tasks: any[]): ContextAwareSuggestion[] {
    const incomplete = tasks.filter(t => t.status !== 'completed');
    const now = new Date();

    return [
      {
        title: 'Review and prioritize your task list',
        priority: 'high',
        category: 'planning',
        estimatedMinutes: 15,
        reason: 'Essential first step for productivity',
        confidence: 0.9,
      },
      {
        title: 'Clear completed tasks to reduce mental load',
        priority: 'medium',
        category: 'maintenance',
        estimatedMinutes: 10,
        reason: 'Reduces cognitive load and provides visual progress',
        confidence: 0.8,
      },
      {
        title: 'Schedule tomorrow\'s top 3 priorities',
        priority: 'medium',
        category: 'planning',
        estimatedMinutes: 20,
        reason: 'Improves next-day focus and reduces decision fatigue',
        confidence: 0.85,
      },
      {
        title: 'Break down large tasks into smaller subtasks',
        priority: incomplete.length > 5 ? 'high' : 'low',
        category: 'organization',
        estimatedMinutes: 25,
        reason: 'Large tasks can cause overwhelm and delay progress',
        confidence: 0.75,
      },
      {
        title: 'Take a short break to reset focus',
        priority: 'high',
        category: 'wellness',
        estimatedMinutes: 5,
        reason: 'Breaks improve sustained focus and prevent burnout',
        confidence: 0.95,
      },
    ];
  }
}