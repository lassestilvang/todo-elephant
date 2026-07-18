import OpenAI from 'openai';
import { TaskModel, ITask } from '../models/task.model';
import { UserModel } from '../models/user.model';
import { adaptiveLearningEngine } from './adaptive-learning';
import { wellbeingEngine } from './wellbeing/cognitive-load';
import { predictiveIntelligence } from './ai/predictive-intelligence';

// Initialize AI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

// AI Task Suggestion Engine
export class AITaskEngine {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async generateSuggestions(context?: string): Promise<TaskSuggestion[]> {
    const userHistory = await this.getUserHistory();
    const prompt = this.buildPrompt(context, userHistory);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are Todo Elephant's AI assistant. Generate actionable, specific, and valuable task suggestions based on the user's context and history. Each suggestion should include:
            1. Clear, actionable title
            2. Priority level (high, medium, low)
            3. Estimated effort (in minutes)
            4. Category (work, personal, health, learning, etc.)
            5. Dependencies (if any)

            Return ONLY valid JSON with this structure:
            {"suggestions": [{"title": "...", "priority": "...", "effort": N, "category": "...", "dependsOn": []}]}`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      return data.suggestions || [];
    } catch (error) {
      console.error('AI suggestion error:', error);
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Prioritize tasks based on multiple factors
   */
  async prioritizeTasks(taskIds: string[], context: string = ''): Promise<TaskPrioritization[]> {
    const tasks = await TaskModel.find({ _id: { $in: taskIds }, userId: this.userId });

    const prompt = this.buildPrioritizationPrompt(tasks, context);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a task prioritization expert. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      return data.prioritizations || [];
    } catch (error) {
      return tasks.map(t => ({
        taskId: t._id.toString(),
        priority: t.priority,
        reason: 'Default prioritization',
        confidence: 0.5,
      }));
    }
  }

  /**
   * Forecast workload
   */
  async forecastWorkload(lookaheadDays: number = 7): Promise<WorkloadForecast> {
    const tasks = await TaskModel.find({ userId: this.userId });

    const prompt = this.buildForecastPrompt(tasks, lookaheadDays);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a workload forecasting expert. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      return {
        dailyCapacity: 8,
        predictedCompletion: [],
        optimalScheduling: [],
        workloadWarnings: [],
      };
    }
  }

  /**
   * Analyze user productivity
   */
  async analyzeProductivity(): Promise<ProductivityAnalysis> {
    const tasks = await TaskModel.find({ userId: this.userId });
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');

    const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

    // Get user profile for adaptive learning
    const user = await UserModel.findById(this.userId);
    const profile = user ? await adaptiveLearningEngine.getOrCreateProfile(user._id.toString()) : null;

    return {
      completionRate: Math.round(completionRate * 100),
      peakHours: profile?.behaviorPattern?.optimalTimes?.map(ot => `${ot.hour}:00`) || [],
      improvementAreas: ['Task prioritization', 'Time estimation'],
      recommendations: [
        'Focus on completing high-priority tasks first',
        'Break down large tasks into smaller subtasks',
        'Schedule focused work sessions during peak hours',
      ],
      cognitiveLoad: await this.calculateCognitiveLoad(tasks),
    };
  }

  /**
   * Calculate cognitive load
   */
  private async calculateCognitiveLoad(tasks: ITask[]): Promise<number> {
    const incomplete = tasks.filter(t => t.status !== 'completed');
    const overdue = incomplete.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    const highPriority = incomplete.filter(t => t.priority === 'high');

    let load = 0;
    load += incomplete.length * 2;
    load += overdue.length * 5;
    load += highPriority.length * 3;

    return Math.min(100, load);
  }

  private async getUserHistory() {
    const recentTasks = await TaskModel.find({ userId: this.userId })
      .sort({ createdAt: 'desc' })
      .limit(10);

    const recentLists = await TaskModel.find({ userId: this.userId })
      .sort({ createdAt: 'desc' })
      .limit(5);

    return { recentTasks, recentLists };
  }

  private buildPrompt(context?: string, userHistory?: any): string {
    const now = new Date();
    const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' });
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening';

    return `
Current context:
- Day: ${dayOfWeek}
- Time of day: ${timeOfDay}
- Context: ${context || 'User wants productivity suggestions'}

Generate 5 task suggestions that would be valuable right now. Consider:
- Tasks that can be completed today
- Dependencies between tasks
- Priority based on urgency and impact
- Realistic effort estimates

Return valid JSON only.`;
  }

  private buildPrioritizationPrompt(tasks: ITask[], context: string): string {
    const taskList = tasks.map(t => `
      Task: ${t.title}
      Priority: ${t.priority}
      Due Date: ${t.dueDate || 'No deadline'}
      Estimated Minutes: ${t.estimatedMinutes || 'Unknown'}
    `).join('\n');

    return `
Context: ${context || 'General prioritization'}

Tasks to prioritize:
${taskList}

Provide prioritization with reasoning.`;
  }

  private buildForecastPrompt(tasks: ITask[], lookaheadDays: number): string {
    const incomplete = tasks.filter(t => t.status !== 'completed');

    return `
User has ${incomplete.length} incomplete tasks.
Forecast next ${lookaheadDays} days.`;
  }

  private getFallbackSuggestions(): TaskSuggestion[] {
    return [
      {
        title: 'Review and prioritize today\'s tasks',
        priority: 'high',
        effort: 15,
        category: 'planning',
        dependsOn: []
      },
      {
        title: 'Clear completed tasks from lists',
        priority: 'medium',
        effort: 10,
        category: 'maintenance',
        dependsOn: []
      },
      {
        title: 'Take a short break and reset focus',
        priority: 'high',
        effort: 5,
        category: 'wellness',
        dependsOn: []
      }
    ];
  }
}

// Type definitions
export interface TaskSuggestion {
  title: string;
  priority: 'high' | 'medium' | 'low';
  effort: number;
  category: string;
  dependsOn: string[];
}

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

export interface ProductivityAnalysis {
  completionRate: number;
  peakHours: string[];
  improvementAreas: string[];
  recommendations: string[];
  cognitiveLoad?: number;
}

export interface SmartSchedule {
  tasks: Array<{
    taskId: string;
    startTime: Date;
    endTime: Date;
  }>;
  totalTime: number;
}

// AI Assistant API Route
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { operation, context, userId } = body;

    const engine = new AITaskEngine(userId);

    switch (operation) {
      case 'generate_suggestions':
        const suggestions = await engine.generateSuggestions(context);
        return Response.json({ success: true, suggestions });

      case 'analyze_productivity':
        const analysis = await engine.analyzeProductivity();
        return Response.json({ success: true, analysis });

      case 'smart_schedule':
        const schedule = await engine.smartSchedule?.(context);
        return Response.json({ success: true, schedule });

      case 'prioritize_tasks':
        const prioritized = await engine.prioritizeTasks(body.taskIds, context);
        return Response.json({ success: true, prioritized });

      case 'forecast_workload':
        const forecast = await engine.forecastWorkload(body.lookaheadDays);
        return Response.json({ success: true, forecast });

      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Assistant error:', error);
    return Response.json({ error: 'AI processing failed' }, { status: 500 });
  }
}

// Singleton instance for easy imports
export const aiTaskEngine = new AITaskEngine('');