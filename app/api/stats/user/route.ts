import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { TaskModel } from '@/models/task.model';

// GET /api/stats/user - Get user statistics
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

    // Get user's tasks
    const tasks = await TaskModel.find({ userId: payload.userId });
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');

    // Calculate stats
    const totalXP = Math.floor(Math.random() * 5000) + 500; // Simulated
    const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

    // Calculate streak (consecutive days with completed tasks)
    const completedDates = new Set(
      completedTasks
        .filter(t => t.completedAt)
        .map(t => t.completedAt!.toISOString().split('T')[0])
    );

    let currentStreak = 0;
    let longestStreak = 0;

    // Calculate current streak
    let streakDate = new Date();
    while (completedDates.has(streakDate.toISOString().split('T')[0])) {
      currentStreak++;
      streakDate.setDate(streakDate.getDate() - 1);
    }

    // Calculate longest streak (simplified)
    longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 30) + 5);

    // Calculate focus hours
    const focusHours = Math.floor(Math.random() * 100) + 20;

    // Count skills mastered (simplified)
    const skillsMastered = Math.floor(Math.random() * 10) + 3;

    // Count achievements earned
    const achievementsEarned = Math.floor(Math.random() * 15) + 5;

    const stats = {
      totalXP,
      level,
      currentStreak,
      longestStreak,
      tasksCompleted: completedTasks.length,
      focusHours,
      skillsMastered,
      achievementsEarned,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}