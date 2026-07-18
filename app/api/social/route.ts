import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Mock social posts for demonstration
const mockPosts = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Lasse',
    userAvatar: 'https://avatars.githubusercontent.com/u/1',
    content: 'Just completed my 7-day streak! 🎯 Feeling productive and focused. The new Pomodoro Forest feature is amazing for maintaining focus.',
    type: 'win',
    likes: 42,
    shares: 5,
    comments: 3,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    hashtags: ['streak', 'productivity', 'focus'],
    taskTitle: 'Complete AI module implementation'
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Alex',
    content: 'Pro tip: Break large tasks into micro-tasks of 15-30 minutes each. It makes them less overwhelming and you get more dopamine hits from completion!',
    type: 'tip',
    likes: 87,
    shares: 12,
    comments: 8,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    hashtags: ['productivity', 'tip', 'microtasks']
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Sam',
    content: 'Taking on the 7-day focus challenge! Starting tomorrow with my most important task. Who wants to join me?',
    type: 'challenge',
    likes: 23,
    shares: 3,
    comments: 15,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    hashtags: ['challenge', 'focus', 'community']
  }
];

// GET /api/social/posts - Get social posts
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
    const feed = searchParams.get('feed') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Filter posts based on feed type
    let filteredPosts = mockPosts;

    if (feed === 'following') {
      // In real app, filter by users the current user follows
      filteredPosts = mockPosts.slice(0, 10);
    } else if (feed === 'trending') {
      // Sort by likes/shares for trending
      filteredPosts = [...mockPosts].sort((a, b) => (b.likes + b.shares) - (a.likes + a.shares));
    }

    // Apply limit
    filteredPosts = filteredPosts.slice(0, limit);

    return NextResponse.json(filteredPosts);
  } catch (error) {
    console.error('GET /api/social/posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/social/posts - Create a new post
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate required fields
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Create new post
    const newPost = {
      id: `post-${Date.now()}`,
      userId: payload.userId,
      userName: payload.email.split('@')[0], // Use email prefix as name
      userAvatar: undefined,
      content: body.content.trim(),
      type: body.type || 'win',
      likes: 0,
      shares: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      hashtags: body.content.match(/#\w+/g) || [],
      relatedTaskId: body.relatedTaskId,
      taskTitle: body.taskTitle
    };

    // In real app, save to database
    // For now, return the new post
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('POST /api/social/posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/social/posts/:id/like - Like a post
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

    const postId = params.id;

    // In real app, update database
    // Return success
    return NextResponse.json({ success: true, message: 'Post liked' });
  } catch (error) {
    console.error('POST /api/social/posts/:id/like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}