import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { UserModel } from '@/models/user.model';
import { TaskModel } from '@/models/task.model';

// AI Task Suggestion Engine
class AISuggestionEngine {
  async generateSuggestions(userId: string, context?: string): Promise<Suggestion[]> {
    // Get user's recent task patterns
    const recentTasks = await TaskModel.find({ userId }).sort({ createdAt: -1 }).limit(20);
    const completedTasks = recentTasks.filter(t => t.status === 'completed');
    const overdueTasks = recentTasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date());

    const suggestions: Suggestion[] = [];

    // Pattern: User always creates similar tasks on Mondays
    if (context?.includes('weekly') || recentTasks.length > 5) {
      const mondayTasks = recentTasks.filter(t => {
        const day = new Date(t.createdAt).getDay();
        return day === 1;
      });
      if (mondayTasks.length > 0) {
        suggestions.push({
          title: 'Review and prioritize last week\'s tasks',
          priority: 'high',
          category: 'review',
          estimatedMinutes: 15,
          reason: 'Based on your weekly planning pattern'
        });
      }
    }

    // Pattern: User has many overdue tasks
    if (overdueTasks.length > 3) {
      suggestions.push({
        title: 'Tackle overdue tasks — start with the most critical',
        priority: 'high',
        category: 'cleanup',
        estimatedMinutes: 30,
        reason: `You have ${overdueTasks.length} overdue tasks`
      });
    }

    // Pattern: User has many high-priority incomplete tasks
    const highPriorityIncomplete = recentTasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    if (highPriorityIncomplete.length > 3) {
      suggestions.push({
        title: 'Focus on high-priority items before new tasks',
        priority: 'medium',
        category: 'focus',
        estimatedMinutes: 45,
        reason: `${highPriorityIncomplete.length} high-priority tasks still incomplete`
      });
    }

    // Pattern: User hasn't done a review this week
    const lastReview = completedTasks.find(t => t.title?.toLowerCase().includes('review'));
    if (!lastReview) {
      suggestions.push({
        title: 'Take time to review and organize your task lists',
        priority: 'medium',
        category: 'organization',
        estimatedMinutes: 20,
        reason: 'No review task found in recent activity'
      });
    }

    // Pattern: Quick wins — tasks that take less than 15 minutes
    const quickTasks = recentTasks.filter(t => t.estimatedMinutes && t.estimatedMinutes < 15 && t.status !== 'completed');
    if (quickTasks.length > 0) {
      suggestions.push({
        title: 'Clear quick wins to build momentum',
        priority: 'low',
        category: 'quick-wins',
        estimatedMinutes: 10,
        reason: `${quickTasks.length} quick tasks pending completion`
      });
    }

    return suggestions.slice(0, 5);
  }
}

interface Suggestion {
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedMinutes: number;
  reason: string;
}

// GET /api/ai-assistant/suggestions — Get AI-powered task suggestions
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context') || '';

    const engine = new AISuggestionEngine();
    const suggestions = await engine.generateSuggestions(payload.userId, context);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI suggestions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ai-assistant/analyze — Analyze user productivity patterns
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { timeframe = 'week', includeTrends = true } = body;

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tasks = await TaskModel.find({ userId: payload.userId }).sort({ createdAt: -1 });
    const now = new Date();
    const timeframeMs = timeframe === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                        timeframe === 'month' ? 30 * 24 * 60 * 60 * 1000 :
                        90 * 24 * 60 * 60 * 1000;

    const cutoff = new Date(now.getTime() - timeframeMs);
    const periodTasks = tasks.filter(t => new Date(t.createdAt) > cutoff);
    const completed = periodTasks.filter(t => t.status === 'completed');
    const completionRate = periodTasks.length > 0 ? completed.length / periodTasks.length : 0;

    // Calculate focus hours
    const focusSessions = periodTasks.filter(t => t.completedMinutes > 0);
    const totalFocusMinutes = focusSessions.reduce((sum, t) => sum + (t.completedMinutes || 0), 0);

    // Identify peak productivity hours
    const hourCounts: Record<number, number> = {};
    completed.forEach(t => {
      const hour = new Date(t.completedAt || t.updatedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // Identify task categories with most completion
    const categoryCompletion: Record<string, number> = {};
    completed.forEach(t => {
      const cat = t.category || 'general';
      categoryCompletion[cat] = (categoryCompletion[cat] || 0) + 1;
    });

    const analysis = {
      timeframe,
      totalTasks: periodTasks.length,
      completedTasks: completed.length,
      completionRate: Math.round(completionRate * 100),
      totalFocusMinutes,
      focusHours: Math.round(totalFocusMinutes / 60),
      peakProductivityHours: peakHours,
      topCategories: Object.entries(categoryCompletion)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count })),
      trends: includeTrends ? {
        completionRateChange: calculateTrend(tasks, 'completionRate', timeframeMs),
        focusTimeChange: calculateTrend(tasks, 'focusMinutes', timeframeMs),
        taskCreationChange: calculateTrend(tasks, 'created', timeframeMs)
      } : undefined,
      insights: generateInsights(completionRate, totalFocusMinutes, peakHours, categoryCompletion)
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateTrend(tasks: any[], metric: string, timeframeMs: number): number {
  const now = new Date().getTime();
  const halfTime = now - timeframeMs / 2;

  const firstHalf = tasks.filter(t => new Date(t.createdAt).getTime() < halfTime);
  const secondHalf = tasks.filter(t => new Date(t.createdAt).getTime() >= halfTime);

  const firstVal = firstHalf.length > 0 ? firstHalf.length : 0;
  const secondVal = secondHalf.length > 0 ? secondHalf.length : 0;

  if (firstVal === 0) return secondVal > 0 ? 100 : 0;
  return Math.round(((secondVal - firstVal) / firstVal) * 100);
}

function generateInsights(completionRate: number, focusMinutes: number, peakHours: string[], categories: Record<string, number>): string[] {
  const insights: string[] = [];

  if (completionRate < 0.4) {
    insights.push('Your completion rate is below 40%. Consider breaking large tasks into smaller, actionable steps.');
  } else if (completionRate > 0.8) {
    insights.push('Your completion rate is excellent! Consider adding stretch goals or more complex tasks.');
  }

  if (focusMinutes < 30) {
    insights.push('Try to increase your focus time — even 30 minutes of deep work can significantly boost productivity.');
  }

  if (peakHours.length > 0) {
    insights.push(`You're most productive around ${peakHours.join(' and ')}. Schedule your most important tasks during these times.`);
  }

  const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push(`You're completing the most tasks in the "${topCat[0]}" category. Consider whether this aligns with your priorities.`);
  }

  return insights;
}