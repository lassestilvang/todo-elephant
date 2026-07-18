import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { TaskModel } from '@/models/task.model';

// GET /api/achievements/user - Get user's achievements
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

    const user = await payload.userId;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // In a real implementation, this would come from an achievements collection
    // For now, return sample achievements based on user's progress
    const mockAchievements = [
      {
        id: 'ach-1',
        name: 'First Steps',
        description: 'Complete your first task',
        icon: 'Target',
        earned: true,
        dateEarned: new Date(Date.now() - 30 * 86400000),
        rarity: 'common',
        xpReward: 50,
      },
      {
        id: 'ach-2',
        name: 'Streak Starter',
        description: 'Maintain a 3-day streak',
        icon: 'Sparkles',
        earned: true,
        dateEarned: new Date(Date.now() - 25 * 86400000),
        rarity: 'common',
        xpReward: 75,
      },
      {
        id: 'ach-3',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: 'Sparkles',
        earned: true,
        dateEarned: new Date(Date.now() - 18 * 86400000),
        rarity: 'rare',
        xpReward: 200,
      },
      {
        id: 'ach-4',
        name: 'Century Club',
        description: 'Complete 100 tasks',
        icon: 'Trophy',
        earned: true,
        dateEarned: new Date(Date.now() - 10 * 86400000),
        rarity: 'rare',
        xpReward: 300,
      },
      {
        id: 'ach-5',
        name: 'Focus Master',
        description: 'Complete 50 focus sessions',
        icon: 'Brain',
        earned: true,
        dateEarned: new Date(Date.now() - 5 * 86400000),
        rarity: 'epic',
        xpReward: 500,
      },
      {
        id: 'ach-6',
        name: 'Task Architect',
        description: 'Create 50 templates',
        icon: 'Brain',
        earned: false,
        dateEarned: null,
        rarity: 'epic',
        xpReward: 750,
      },
      {
        id: 'ach-7',
        name: 'Collaboration Champion',
        description: 'Collaborate with 10 different team members',
        icon: 'Users',
        earned: false,
        dateEarned: null,
        rarity: 'epic',
        xpReward: 600,
      },
      {
        id: 'ach-8',
        name: 'Legendary Elephant',
        description: 'Reach level 50',
        icon: 'Medal',
        earned: false,
        dateEarned: null,
        rarity: 'legendary',
        xpReward: 2000,
      },
    ];

    return NextResponse.json({ achievements: mockAchievements });
  } catch (error) {
    console.error('Achievements fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}