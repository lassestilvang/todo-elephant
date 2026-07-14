import { NextRequest, NextResponse } from 'next/server';
import { ListModel } from '@/models/list.model';
import { dbConnect } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/lists - List all lists
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

    const lists = await ListModel.find({ status: 'active' })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(lists);
  } catch (error) {
    console.error('GET /api/lists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/lists - Create new list
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

    const body = await request.json();

    if (!body?.name) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    // Get max order for new list
    const maxOrder = await ListModel.countDocuments() || 0;

    const list = new ListModel({
      name: body.name.trim(),
      description: body.description,
      color: body.color || '#3b82f6',
      order: maxOrder
    });

    const savedList = await list.save();

    return NextResponse.json(savedList, { status: 201 });
  } catch (error) {
    console.error('POST /api/lists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}