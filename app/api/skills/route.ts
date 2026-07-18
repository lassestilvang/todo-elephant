import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { UserModel } from '@/models/user.model';

// GET /api/skills/user - Get user's skills
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

    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // In a real implementation, this would come from a skills collection
    // For now, we'll return sample skills based on user's task history
    const mockSkills = [
      { id: 'skill-1', name: 'Task Planning', level: 75, xp: 1500, xpToNext: 2000, category: 'analytical', lastPracticed: new Date(), relatedTasks: 12 },
      { id: 'skill-2', name: 'Creative Writing', level: 60, xp: 800, xpToNext: 1500, category: 'creative', lastPracticed: new Date(), relatedTasks: 8 },
      { id: 'skill-3', name: 'Code Review', level: 45, xp: 300, xpToNext: 1000, category: 'technical', lastPracticed: new Date(), relatedTasks: 5 },
      { id: 'skill-4', name: 'Project Management', level: 80, xp: 2500, xpToNext: 3000, category: 'leadership', lastPracticed: new Date(), relatedTasks: 15 },
      { id: 'skill-5', name: 'Design Thinking', level: 35, xp: 200, xpToNext: 800, category: 'creative', lastPracticed: new Date(), relatedTasks: 3 },
      { id: 'skill-6', name: 'Data Analysis', level: 55, xp: 600, xpToNext: 1200, category: 'analytical', lastPracticed: new Date(), relatedTasks: 7 },
      { id: 'skill-7', name: 'API Design', level: 40, xp: 250, xpToNext: 900, category: 'technical', lastPracticed: new Date(), relatedTasks: 4 },
      { id: 'skill-8', name: 'Team Facilitation', level: 65, xp: 1000, xpToNext: 1800, category: 'leadership', lastPracticed: new Date(), relatedTasks: 9 },
    ];

    return NextResponse.json({ skills: mockSkills });
  } catch (error) {
    console.error('Skills fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/skills/practice - Practice a skill (gain XP)
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
    const { skillId } = body;

    if (!skillId) {
      return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
    }

    // In a real implementation, this would update the skill in database
    // For now, return success with new XP
    const xpGained = Math.floor(Math.random() * 50) + 10; // 10-60 XP

    return NextResponse.json({
      success: true,
      xpGained,
      message: `You earned ${xpGained} XP!`
    });
  } catch (error) {
    console.error('Skill practice error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}