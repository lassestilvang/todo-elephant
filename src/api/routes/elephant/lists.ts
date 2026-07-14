import { NextRequest, NextResponse } from 'next/server';
import { ListModel } from '@/models/list.model';
import { validateRequest } from '@/lib/validation';
import { broadcastListChange } from '@/lib/events';

const listSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description?: String,
  color?: String,
});

const listSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description?: String,
  color?: String,
});

export async function GET(req: NextRequest) {
  const lists = await ListModel.find().lean();
  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequest(listSchema, body);
    if (!result.success) {
      return NextResponse.json({ errors: result.error.errors }, { status: 400 });
    }

    const list = await ListModel.create({
      ...resultData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}