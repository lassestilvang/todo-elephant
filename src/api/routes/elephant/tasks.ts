import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TaskModel } from '@/models/task.model';
import { validateRequest } from '@/lib/validation';
import { authorize } from '@/lib/security';
import { broadcastTaskChange } from '@/lib/events';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description?: String,
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).default('todo'),
  priority?: 'low' | 'medium' | 'high',
  listId?: String,
  labelId?: String,
  dueDate?: String,
  assignedTo?: String,
});

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Too long'),
  description?: String,
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  listId?: String,
  labelId?: String,
  dueDate?: String,
  assignedTo?: String,
});

export async function GET(req: NextRequest) {
  // Authorization check
  if (!(await rateLimit(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tasks = await TaskModel.find().lean();
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  if (!(await rateLimit(req))) {
    return new NextResponse('Rate limited', { status: 429 });
  }

  try {
    const body = await request.json();
    const result = validateRequest(taskSchema, body);
    if (!result.success) {
      return NextResponse.json({ errors: result.error.errors }, { status: 400 });
    }

    const task = await TaskModel.create({
      ...resultData,
      createdAt: new Date(),
      updatedAt: Date.now()
    });

    broadcastTaskChange('create', task);
    return NextResponse.json({ task: createdData }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}