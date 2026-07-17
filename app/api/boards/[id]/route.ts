import { NextRequest, NextResponse } from 'next/server';
import { BoardModel } from '@/models/board.model';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';

// GET /api/boards/[id] - Get a specific board
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const board = await BoardModel.findById(id);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Check if user is a member
    const member = board.members.find(m => m.userId === payload.userId);
    if (!member) {
      return NextResponse.json({ error: 'Not a board member' }, { status: 403 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Get board error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/boards/[id] - Update a board
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();
    const { name, description, color } = body;

    const board = await BoardModel.findById(id);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Check if user has edit permission or higher
    const member = board.members.find(m => m.userId === payload.userId);
    if (!member || (member.permission !== 'edit' && member.permission !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (name !== undefined) board.name = name;
    if (description !== undefined) board.description = description;
    if (color !== undefined) board.color = color;

    await board.save();

    return NextResponse.json(board);
  } catch (error) {
    console.error('Update board error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boards/[id] - Archive a board
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const board = await BoardModel.findById(id);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Check if user is admin
    const member = board.members.find(m => m.userId === payload.userId);
    if (!member || member.permission !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete/archive boards' }, { status: 403 });
    }

    // Soft delete by archiving
    board.archived = true;
    board.archivedAt = new Date();

    await board.save();

    return NextResponse.json({ success: true, message: 'Board archived successfully' });
  } catch (error) {
    console.error('Delete board error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}