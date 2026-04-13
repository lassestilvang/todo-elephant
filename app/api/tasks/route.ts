import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

let tasks: any[] = [];
let nextId = 1;

export async function GET(request: NextRequest) {
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newTask = {
    id: nextId++,
    title: body.title || 'Untitled Task',
    description: body.description || '',
    dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : new Date().toISOString(),
    priority: body.priority || 'medium',
    status: body.status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  return NextResponse.json(newTask, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const index = tasks.findIndex((t: any) => t.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  tasks[index] = { 
    ...tasks[index], 
    ...body, 
    updatedAt: new Date().toISOString() 
  };
  return NextResponse.json(tasks[index]);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }
  const index = tasks.findIndex((t: any) => t.id === Number(id));
  if (index === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  tasks.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}