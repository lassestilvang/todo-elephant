import { NextRequest, NextResponse } from 'next/server';
import { BoardModel } from '@/models/board.model';
import { UserModel } from '@/models/user.model';
import { verifyToken } from '@/lib/auth';
import { dbConnect } from '@/lib/db';

// POST /api/boards - Create a new board
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
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    // Find the user
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create board with the creator as admin
    const board = new BoardModel({
      name,
      description,
      color,
      members: [{
        userId: user._id.toString(),
        permission: 'admin'
      }]
    });

    await board.save();

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error('Create board error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/boards - List boards for the authenticated user
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
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;

    // Find boards where the user is a member
    const boards = await BoardModel.find({
      'members.userId': userId,
      archived: false
    }).sort({ updatedAt: -1 });

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Get boards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}