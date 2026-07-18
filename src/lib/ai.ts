import OpenAI from 'openai';
import { prisma } from './prisma';

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

  private async getUserHistory() {
    // Get recent user activity
    const recentTasks = await prisma.task.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentLists = await prisma.list.findMany({
      where: { userId: this.userId },
      orderBy: { name: 'asc' },
      take: 5,
    });

    return { recentTasks, recentLists };
  }

  private buildPrompt(context?: string): string {
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

  private getFallbackSuggestions(): TaskSuggestion[] {
    const now = new Date();
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
        title: 'Set up tomorrow\'s task list',
        priority: 'medium',
        effort: 20,
        category: 'planning',
        dependsOn: []
      },
      {
        title: 'Review long-term goals',
        priority: 'low',
        effort: 30,
        category: 'strategic',
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
        const schedule = await engine.smartSchedule(context);
        return Response.json({ success: true, schedule });

      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Assistant error:', error);
    return Response.json({ error: 'AI processing failed' }, { status: 500 });
  }
}

// Type definitions
interface TaskSuggestion {
  title: string;
  priority: 'high' | 'medium' | 'low';
  effort: number;
  category: string;
  dependsOn: string[];
}

interface ProductivityAnalysis {
  completionRate: number;
  peakHours: string[];
  improvementAreas: string[];
  recommendations: string[];
}

interface SmartSchedule {
  tasks: Array<{
    taskId: string;
    startTime: Date;
    endTime: Date;
  }>;
  totalTime: number;
}