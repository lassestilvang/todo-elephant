import { NextRequest, NextResponse } from 'next/server';
import { withCache } from '@/middleware/cache';
import { authMiddleware } from '@/lib/middleware';

/**
 * Cache configuration for GET /api/elephant/tasks endpoint
 * Uses task cache with 60s TTL
 */
const GET_tasks_cached = withCache(async (request: NextRequest) => {
  const query = request.nextUrl.searchParams;
  const status = query.get('status') || 'all';
  const listId = query.get('listId') || null;
  const labelId = query.get('labelId') || null;

  // In production: fetch from MongoDB using TaskModel
  const tasks = await fetchTasksFromDB(status, listId, labelId);

  return NextResponse.json({ tasks });
};

// GET /api/elephant/tasks - List all tasks (with filters)
// CACHED: 60s TTL by default
export async function GET_tasks(request: NextRequest) {
  return await GET_tasks_cached(request);
}

async function fetchTasksFromDB(status: string, listId: string | null, labelId: string | null) {
  // Production: query using MongoDB
  return [{ id: '1', title: 'Sample Task', status: 'pending' }];
}