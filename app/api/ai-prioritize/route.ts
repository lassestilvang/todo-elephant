// ai-prioritize route
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { TaskModel } from '@/models/task.model';
import { AITaskEngine } from '@/lib/ai';

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
    const { taskIds, context = '' } = body;

    const engine = new AITaskEngine(payload.userId);
    const prioritizedTasks = await engine.prioritizeTasks(taskIds, context);

    return NextResponse.json({ success: true, prioritizedTasks });
  } catch (error) {
    console.error('AI prioritize error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Forecast route
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
    const { lookaheadDays = 7 } = body;

    const engine = new AITaskEngine(payload.userId);
    const forecast = await engine.forecastWorkload(lookaheadDays);

    return NextResponse.json({ success: true, forecast });
  } catch (error) {
    console.error('AI forecast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}