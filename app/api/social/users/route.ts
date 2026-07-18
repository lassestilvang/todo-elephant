import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Mock user data for demonstration
const mockUsers = [
  {
    id: 'user1',
    name: 'Lasse Stilvang',
    email: 'lassestilvang@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/1',
    streak: 42,
    achievements: ['7-day-streak', 'ai-master', 'focus-pro'],
    followers: 123,
    following: 45
  },
  {
    id: 'user2',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/2',
    streak: 15,
    achievements: ['productivity-wizard', 'task-titan'],
    followers: 89,
    following: 34
  },
  {
    id: 'user3',
    name: 'Sam Wilson',
    email: 'sam@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/3',
    streak: 28,
    achievements: ['challenge-champion', 'streak-builder'],
    followers: 156,
    following: 78
  }
];

// GET /api/social/users - Search users
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Filter users by search term
    let filteredUsers = mockUsers;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = mockUsers.filter(
        user => user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    filteredUsers = filteredUsers.slice(0, limit);

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error('GET /api/social/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/social/users/:id/follow - Follow a user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = params.id;

    // Check if user exists
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // In real app, update follow relationship in database
    // For now, return success
    return NextResponse.json({
      success: true,
      message: `Following ${user.name}`,
      user: {
        id: user.id,
        name: user.name,
        isFollowing: true
      }
    });
  } catch (error) {
    console.error('POST /api/social/users/:id/follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/social/users/:id - Get user profile
export async function GET_USER(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = params.id;

    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/social/users/:id error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}