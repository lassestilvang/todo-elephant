import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LabelModel } from '@/models/label.model';
import { validateRequest } from '@/lib/validation';
import { broadcastLabelChange } from '@/lib/events';

const labelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Invalid hex color'),
  description?: String,
});

export async function GET(req: NextRequest) {
  const labels = await LabelModel.find().lean();
  return NextResponse.json({ labels });
}

export async function POST(req: NextRequest) {
  try {
    const body = await request.json();
    const result = validateRequest(labelSchema, body);
    if (!result.success) {
      return NextResponse.json({ errors: result.error.errors }, { status: 400 });
    }

    const label = await LabelModel.create({
      ...resultData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    broadcastLabelChange('create', label);
    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}