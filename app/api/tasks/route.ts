import { NextRequest, NextResponse } from 'next/server';
import { TaskModel } from '@/src/models/task.model';
import { dbConnect } from '@/src/lib/db';
import { verifyToken } from '@/src/lib/auth';
import { getFromCache, setInCache, deleteFromCache, cacheKey, invalidateRelatedCaches } from '@/src/lib/cache';

// GET /api/tasks - List all tasks with optional filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const listId = searchParams.get('listId');
    const labelId = searchParams.get('labelId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build cache key
    const cacheParams: Record<string, any> = { status, listId, labelId, search, page, limit };
    const cacheKeyString = cacheKey('tasks', userId, cacheParams);

    // Try to get from cache
    const cachedTasks = await getFromCache(cacheKeyString);
    if (cachedTasks) {
      return NextResponse.json(cachedTasks);
    }

    // Build query
    const query: any = { userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (listId) {
      query.listId = listId;
    }

    if (labelId) {
      query.labelIds = labelId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Paginated query with lean results for better performance
    const skip = (page - 1) * limit;
    const tasks = await TaskModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // Get total count for pagination
    const totalTasks = await TaskModel.countDocuments(query);

    const result = {
      tasks,
      pagination: {
        page,
        limit,
        total: totalTasks,
        totalPages: Math.ceil(totalTasks / limit)
      }
    };

    // Cache for 5 minutes
    await setInCache(cacheKeyString, result, 300);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    // Create task
    const task = new TaskModel({
      userId,
      title: body.title,
      description: body.description,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      listId: body.listId,
      labelIds: body.labels || body.labelIds,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      assignedTo: body.assignedTo,
      dependsOnTaskId: body.dependsOnTaskId,
      isImportant: body.isImportant || false,
      isUrgent: body.isUrgent || false,
      recurrence: body.recurrence || 'none',
      completedPomodoros: 0,
      subtasks: body.subtasks || [],
      isTemplate: body.isTemplate || false
    });

    const savedTask = await task.save();

    // Invalidate related caches
    await invalidateRelatedCaches(userId, 'task', [savedTask._id.toString()]);

    return NextResponse.json(savedTask, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}