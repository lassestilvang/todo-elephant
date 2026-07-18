import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { adaptiveLearningEngine } from '@/lib/adaptive-learning';

// GET /api/adaptive-learning/recommendations - Get personalized recommendations
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
    const context = searchParams.get('context') || undefined;

    const recommendations = await adaptiveLearningEngine.getPersonalizedRecommendations(
      payload.userId,
      context || undefined
    );

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Adaptive learning error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/adaptive-learning/learn - Learn from user behavior
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
    const { actions } = body;

    if (!actions || !Array.isArray(actions)) {
      return NextResponse.json({ error: 'Actions array is required' }, { status: 400 });
    }

    const profile = await adaptiveLearningEngine.learnFromBehavior(payload.userId, actions);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Adaptive learning error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}