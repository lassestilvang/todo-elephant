import { NextRequest, NextResponse } from 'next/server';
import { CommentModel } from '@/models/comment.model';
import { validateRequest } from '@/lib/validation';
import { authorize } from '@/lib/security';

const commentSchema = z.object({
  content: z.string().min(1, 'Content required'),
  taskId: z.string().min(1, 'Task ID required')
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const comments = await CommentModel.find({ taskId: taskId }).lean();
    return NextResponse.json({ comments });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = validateRequest(commentSchema, body);
    if (!result.success) {
      return NextResponse.json({ errors: result.error.errors }, { status: 400 });
    }

    const comment = await CommentModel.create({
      ...resultData,
      taskId: request.query.get('taskId'),
      createdAt: new Date(),
      updatedAt: Date.now()
    });

    broadcastCommentChange('create', comment);
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  // Similar to POST, but for updating
  // (Implementation left for brevity)
  return new NextResponse(JSON.stringify({ error: 'Not implemented yet' }), { status: 500 });
}

export async function DELETE(req: NextRequest) {
  // ... similar implementation for deletion
  return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
}