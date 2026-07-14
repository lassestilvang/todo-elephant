import { NextRequest, NextResponse } from 'next/server';
import { LabelModel } from '@/models/label.model';
import { dbConnect } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/labels - List all labels
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

    const labels = await LabelModel.find({ status: 'active' })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(labels);
  } catch (error) {
    console.error('GET /api/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/labels - Create new label
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
      return NextResponse.json({ error: 'Label name is required' }, { status: 400 });
    }

    // Check if label with same name exists
    const existing = await LabelModel.findOne({ name: body.name.trim() });
    if (existing) {
      return NextResponse.json(existing);
    }

    // Get max order for new label
    const count = await LabelModel.countDocuments();

    const label = new LabelModel({
      name: body.name.trim(),
      description: body.description,
      color: body.color || '#64748b',
      order: count
    });

    const savedLabel = await label.save();

    return NextResponse.json(savedLabel, { status: 201 });
  } catch (error) {
    console.error('POST /api/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}